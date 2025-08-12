# UPD Cookie Jar (Faucet) design

This document outlines how to implement a “cookie jar” faucet for the UPD ERC‑20 token, inspired by CookieJar.sol, and how to adapt it to require BrightID verification for eligibility (whitelisting).

## Goals
- Each address can claim once per 7 days (rolling window since their last claim)
- Per-claim amount equals 1% of the contract’s current UPD balance at claim time
- Use UPD ERC‑20 token (18 decimals)
- Only BrightID-verified users for a specific BrightID context may claim
- Safe, pausable, and resistant to reentrancy

## Contract sketch
Below is a concise sketch to communicate the intended behaviors and interfaces. Exact code will depend on your base contract library (OpenZeppelin recommended).

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

interface IBrightIDVerifier {
  // Adapt this interface to BrightID-SmartContract integration (see section below)
  function isVerified(bytes32 context, address addr) external view returns (bool);
}

contract UpdCookieJar is ReentrancyGuard, Pausable, Ownable2Step {
  IERC20 public immutable token;           // UPD token
  IBrightIDVerifier public brightId;       // BrightID verifier contract
  bytes32 public brightIdContext;          // BrightID context id (bytes32)
  uint256 public constant COOLDOWN = 7 days;

  mapping(address => uint256) public lastClaimAt; // last claim timestamp per address

  event Claimed(address indexed user, uint256 amount);
  event BrightIDUpdated(address indexed verifier, bytes32 context);

  constructor(address updToken, address brightIdVerifier, bytes32 context) {
    require(updToken != address(0), "bad token");
    token = IERC20(updToken);
    brightId = IBrightIDVerifier(brightIdVerifier);
    brightIdContext = context;
  }

  function setBrightID(address brightIdVerifier, bytes32 context) external onlyOwner {
    brightId = IBrightIDVerifier(brightIdVerifier);
    brightIdContext = context;
    emit BrightIDUpdated(brightIdVerifier, context);
  }

  function claim() external nonReentrant whenNotPaused {
    // Eligibility: BrightID verification
    require(brightId.isVerified(brightIdContext, msg.sender), "not BrightID verified");

    // Cooldown: per-address rolling 7 days
    uint256 last = lastClaimAt[msg.sender];
    require(block.timestamp >= last + COOLDOWN, "cooldown");

    // 1% of current balance (rounds down)
    uint256 bal = token.balanceOf(address(this));
    require(bal > 0, "empty");
    uint256 amount = bal / 100; // 1%
    require(amount > 0, "too small");

    lastClaimAt[msg.sender] = block.timestamp;
    require(token.transfer(msg.sender, amount), "transfer failed");

    emit Claimed(msg.sender, amount);
  }

  // Admin controls
  function pause() external onlyOwner { _pause(); }
  function unpause() external onlyOwner { _unpause(); }

  // Optional: rescue tokens accidentally sent to the jar (excluding UPD if you want strictness)
  function sweep(address erc20, address to) external onlyOwner {
    require(erc20 != address(token), "no sweep UPD");
    IERC20 t = IERC20(erc20);
    t.transfer(to, t.balanceOf(address(this)));
  }
}
```

### Behavioral notes
- Amount = 1% of the contract’s balance at claim time. This naturally decays as tokens are claimed until more UPD is deposited.
- Cooldown is tracked per address using `lastClaimAt` and a 7‑day interval.
- The jar holds UPD; refills happen via normal ERC‑20 transfers into the jar’s address.

## BrightID whitelist integration
To rely on BrightID for eligibility, you’ll use the contracts from `BrightID/BrightID-SmartContract`. The exact on-chain integration differs depending on which module you choose from that repository, but the common patterns are:

- A contract maintains the mapping (or computed property) of whether an address is verified for a specific BrightID “context”.
- Your faucet contract calls into that contract on `claim()` to enforce `require(isVerified(context, msg.sender))`.

In practice you will:
- Deploy or reference an existing BrightID verification contract that implements a function like:
  - `function isVerified(bytes32 context, address addr) external view returns (bool)`
- Store the BrightID context identifier (BrightID uses per-app “contexts”). A bytes32 (hash) of the UTF‑8 context string is typical.
- Update your faucet to reference the verifier contract and context.

### Likely contract changes vs. CookieJar.sol
If CookieJar.sol used an internal allowlist (e.g., `mapping(address => bool) whitelist`) or a simple owner-managed gating, you will:
- Remove the internal whitelist mapping and management functions.
- Add an immutable or owner‑settable reference to the BrightID verifier contract and the context id.
- Replace `onlyWhitelisted(msg.sender)` checks with `require(brightId.isVerified(context, msg.sender), "not BrightID verified")`.
- Optionally, add a freshness constraint if your chosen BrightID verifier exposes timestamps/epochs of verification (e.g., require “verified within last N days”).

### Choosing/defining the verifier interface
The BrightID repo offers different integration styles. Map their chosen contract to a minimal interface you can depend on from the faucet, for example:

```solidity
interface IBrightIDVerifier {
  function isVerified(bytes32 context, address addr) external view returns (bool);
}
```

If instead the integration expects signature proofs (off‑chain BrightID node signatures) passed in at claim time, you would:
- Add a claim function accepting the proof payload and signature.
- Verify it via ECDSA/EIP‑191/EIP‑712 using the BrightID verifier’s public key (or a registry contract) and enforce replay protection.
- Cache successful verifications if the upstream design allows it, to reduce cost on future claims.

## Security considerations
- Use OpenZeppelin `ReentrancyGuard` and CEI pattern in `claim()`.
- Consider `Pausable` to halt claims during incidents.
- Consider preventing UPD sweep (as above) or allow controlled migration.
- External call to BrightID verifier is a view; ensure the verifier is trusted and immutable or only updatable by owner.
- If the BrightID verifier has upgradability, verify admin trust assumptions.

## Parameters to configure
- `brightId` (address): Deployed BrightID verifier contract address
- `brightIdContext` (bytes32): Context identifier used by Updraft (hash of the public context string)
- `COOLDOWN` (uint256): 7 days
- `token` (address): UPD token address

## Deployment & operations
1. Deploy `UpdCookieJar` with `updToken`, `brightIdVerifier`, and `context`.
2. Fund the jar by transferring UPD to the contract address.
3. Publish the BrightID context and verification instructions to users.
4. Monitor UPD balance and top up as needed.

## Tests to include
- Claim success path (BrightID verified, cooldown satisfied, transfers 1% of current balance)
- Claim blocked when not verified
- Cooldown enforcement per address
- Pausing prevents claims
- Sweep behavior (if enabled)
- Verifier/context updates restricted to owner

## Frontend expectations
- If the user is eligible now, show claimable amount (1% of on‑chain balance) and a “Collect” button.
- If not eligible, show next eligible time (lastClaimAt + 7 days).
- Show an explanatory link to the BrightID verification flow for non‑verified users.

## References
- CookieJar (guidance): repository link provided in task
- BrightID Smart Contract repo: `https://github.com/BrightID/BrightID-SmartContract`
- OpenZeppelin contracts: `https://docs.openzeppelin.com/contracts/`
