import { expect } from '@open-wc/testing';
import { 
  ideaId, 
  tags, 
  hasTags, 
  isLoading, 
  setIdeaId, 
  setTags, 
  resetState 
} from '../idea-state';

describe('Idea State Module', () => {
  beforeEach(() => {
    // Reset state before each test
    resetState();
  });

  describe('Signals', () => {
    it('should initialize with default values', () => {
      expect(ideaId.get()).to.be.null;
      expect(tags.get()).to.deep.equal([]);
      expect(isLoading.get()).to.be.false;
    });
  });

  describe('Computed Values', () => {
    it('hasTags should be false when tags is empty', () => {
      expect(hasTags.get()).to.be.false;
    });

    it('hasTags should be true when tags has items', () => {
      setTags(['tag1', 'tag2']);
      expect(hasTags.get()).to.be.true;
    });
  });

  describe('Actions', () => {
    it('setIdeaId should update ideaId signal', () => {
      setIdeaId('123');
      expect(ideaId.get()).to.equal('123');
    });

    it('setTags should update tags signal', () => {
      setTags(['tag1', 'tag2']);
      expect(tags.get()).to.deep.equal(['tag1', 'tag2']);
    });

    it('resetState should reset all signals to default values', () => {
      setIdeaId('123');
      setTags(['tag1', 'tag2']);
      isLoading.set(true);
      
      resetState();
      
      expect(ideaId.get()).to.be.null;
      expect(tags.get()).to.deep.equal([]);
      expect(isLoading.get()).to.be.false;
    });
  });
});
