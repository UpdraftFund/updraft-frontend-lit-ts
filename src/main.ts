import { toHex, parseUnits } from 'viem';
import { createConnection } from './web3.ts';
import { updraftAddress, feeToken, updateProfile, createIdea, percentScale } from './contracts/updraft.ts';

createConnection();

const b1 = document.getElementById("updraft-address-button");
const e1 = document.getElementById("updraft-address");
if(b1 && e1){
  b1.addEventListener("click", () => {
    e1.textContent = `Updraft address: ${updraftAddress()}`;
  });
}

const b2 = document.getElementById("feeToken-button");
const e2 = document.getElementById("feeToken");
if (b2 && e2){
  b2.addEventListener("click", async () => {
    const feeTokenAddress = await feeToken();
    e2.textContent = `Fee token address: ${feeTokenAddress}`;
  });
}

const profileButton = document.getElementById("updateProfile-button");
const profile = document.getElementById("profile") as HTMLInputElement;
if (profileButton && profile){
  profileButton.addEventListener("click", async () => {
    updateProfile(toHex(profile.value));
  });
}

const form = document.getElementById('idea-form')
if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const scale = await percentScale();
    const contributorFee = document.getElementById('contributor-fee') as HTMLInputElement;
    const contribution = document.getElementById('contribution') as HTMLInputElement;
    const ideaData = document.getElementById('idea-data') as HTMLInputElement;
    const ideaAddress = document.getElementById('idea-address');
    if(contributorFee && contribution && ideaData && ideaAddress){
      ideaAddress.textContent = await createIdea(
        BigInt(contributorFee.value) * scale / 100n,
        parseUnits(contribution.value, 18),
        toHex(ideaData.value)
      );
    }
  });
}
