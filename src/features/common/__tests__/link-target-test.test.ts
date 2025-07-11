import { expect } from '@open-wc/testing';
import { render } from 'lit';
import { formattedText } from '../utils/format-utils';

describe('Link Target Functionality', () => {
  it('should add target="_blank" and rel="noreferrer" to markdown links', () => {
    const input = 'Visit [our website](https://example.com) for more info.';
    const result = formattedText(input);

    // Create a test container and render the directive
    const container = document.createElement('div');
    render(result, container);

    // Check that the link has the correct attributes
    const link = container.querySelector('a');
    expect(link).to.exist;
    expect(link?.getAttribute('href')).to.equal('https://example.com');
    expect(link?.getAttribute('target')).to.equal('_blank');
    expect(link?.getAttribute('rel')).to.equal('noreferrer');
    expect(link?.textContent).to.equal('our website');
  });

  it('should add target="_blank" and rel="noreferrer" to HTML links', () => {
    const input = '<p>Visit <a href="https://example.com">our website</a></p>';
    const result = formattedText(input);

    // Create a test container and render the directive
    const container = document.createElement('div');
    render(result, container);

    // Check that the link has the correct attributes
    const link = container.querySelector('a');
    expect(link).to.exist;
    expect(link?.getAttribute('href')).to.equal('https://example.com');
    expect(link?.getAttribute('target')).to.equal('_blank');
    expect(link?.getAttribute('rel')).to.equal('noreferrer');
    expect(link?.textContent).to.equal('our website');
  });

  it('should handle multiple links correctly', () => {
    const input =
      'Check out [site 1](https://example.com) and [site 2](https://another.com)!';
    const result = formattedText(input);

    // Create a test container and render the directive
    const container = document.createElement('div');
    render(result, container);

    // Check that both links have the correct attributes
    const links = container.querySelectorAll('a');
    expect(links.length).to.equal(2);

    links.forEach((link) => {
      expect(link.getAttribute('target')).to.equal('_blank');
      expect(link.getAttribute('rel')).to.equal('noreferrer');
    });

    expect(links[0].getAttribute('href')).to.equal('https://example.com');
    expect(links[0].textContent).to.equal('site 1');
    expect(links[1].getAttribute('href')).to.equal('https://another.com');
    expect(links[1].textContent).to.equal('site 2');
  });
});
