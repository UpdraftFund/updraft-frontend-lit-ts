import { toHex, parseUnits } from 'viem';
import * as updraft from './contracts/updraft.ts';

const b1 = document.getElementById("updraft-address-button");
const e1 = document.getElementById("updraft-address");
if(b1 && e1){
  b1.addEventListener("click", () => {
    e1.textContent = `Updraft address: ${updraft.address()}`;
  });
}

const b2 = document.getElementById("feeToken-button");
const e2 = document.getElementById("feeToken");
if (b2 && e2){
  b2.addEventListener("click", async () => {
    e2.textContent = `Fee token address: ${await updraft.feeToken()}`;
  });
}

const profileButton = document.getElementById("updateProfile-button");
const profile = document.getElementById("profile") as HTMLInputElement;
if (profileButton && profile){
  profileButton.addEventListener("click", async () => {
    updraft.updateProfile(toHex(profile.value));
  });
}

const form = document.getElementById('idea-form')
if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const scale = await updraft.percentScale();
    const contributorFee = document.getElementById('contributor-fee') as HTMLInputElement;
    const contribution = document.getElementById('contribution') as HTMLInputElement;
    const ideaData = document.getElementById('idea-data') as HTMLInputElement;
    const ideaAddress = document.getElementById('idea-address');
    if(contributorFee && contribution && ideaData && ideaAddress){
      ideaAddress.textContent = await updraft.createIdea(
        BigInt(contributorFee.value) * scale / 100n,
        parseUnits(contribution.value, 18),
        toHex(ideaData.value)
      );
    }
  });
}
