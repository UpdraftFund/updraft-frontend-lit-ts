import { expect } from '@open-wc/testing';
import {
  userAddress,
  userProfile,
  isConnecting,
  connectionError,
  networkName,
  resetState,
  setUserAddress,
  setUserProfile,
  setIsConnecting,
  setConnectionError,
  setNetworkName,
  isConnected,
  hasProfile,
} from '@state/user';

describe('User State Module', () => {
  // Reset state before each test to ensure a clean state
  beforeEach(() => {
    resetState();
  });

  describe('State Signals', () => {
    it('should initialize with null values', () => {
      expect(userAddress.get()).to.be.null;
      expect(userProfile.get()).to.be.null;
      expect(isConnecting.get()).to.be.false;
      expect(connectionError.get()).to.be.null;
      expect(networkName.get()).to.be.null;
    });

    it('should update userAddress when setUserAddress is called', () => {
      const address = '0x1234567890123456789012345678901234567890';
      setUserAddress(address);
      expect(userAddress.get()).to.equal(address);
    });

    it('should update userProfile when setUserProfile is called', () => {
      const profile = {
        name: 'Test User',
        image: 'test-image.png',
        avatar: 'test-avatar.png',
      };
      setUserProfile(profile);
      expect(userProfile.get()).to.deep.equal(profile);
    });

    it('should update isConnecting when setIsConnecting is called', () => {
      setIsConnecting(true);
      expect(isConnecting.get()).to.be.true;
    });

    it('should update connectionError when setConnectionError is called', () => {
      const error = 'Connection failed';
      setConnectionError(error);
      expect(connectionError.get()).to.equal(error);
    });

    it('should update networkName when setNetworkName is called', () => {
      const name = 'Arbitrum';
      setNetworkName(name);
      expect(networkName.get()).to.equal(name);
    });
  });

  describe('Computed Signals', () => {
    it('isConnected should be true when userAddress is set', () => {
      expect(isConnected.get()).to.be.false;
      setUserAddress('0x1234567890123456789012345678901234567890');
      expect(isConnected.get()).to.be.true;
    });

    it('hasProfile should be true when userProfile is set', () => {
      expect(hasProfile.get()).to.be.false;
      setUserProfile({
        name: 'Test User',
        image: 'test-image.png',
        avatar: 'test-avatar.png',
      });
      expect(hasProfile.get()).to.be.true;
    });
  });

  describe('Reset State', () => {
    it('should reset all state values to initial values', () => {
      // Set some values
      setUserAddress('0x1234567890123456789012345678901234567890');
      setUserProfile({
        name: 'Test User',
        image: 'test-image.png',
        avatar: 'test-avatar.png',
      });
      setIsConnecting(true);
      setConnectionError('Error');
      setNetworkName('Arbitrum');

      // Verify values are set
      expect(userAddress.get()).to.not.be.null;
      expect(userProfile.get()).to.not.be.null;
      expect(isConnecting.get()).to.be.true;
      expect(connectionError.get()).to.not.be.null;
      expect(networkName.get()).to.not.be.null;

      // Reset state
      resetState();

      // Verify values are reset
      expect(userAddress.get()).to.be.null;
      expect(userProfile.get()).to.be.null;
      expect(isConnecting.get()).to.be.false;
      expect(connectionError.get()).to.be.null;
      expect(networkName.get()).to.be.null;
    });
  });
});
