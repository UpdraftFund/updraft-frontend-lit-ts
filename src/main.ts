import { createConnection } from './web3.ts';
import { updraftAddress, feeToken } from './contracts/updraft.ts';

createConnection();

const b1 = document.getElementById("updraft-address-button");
const e1 = document.getElementById("updraft-address");
if(b1 && e1){
  b1.addEventListener("click", () => {
    e1.innerHTML = `Updraft address: ${updraftAddress()}`;
  });
}

const b2 = document.getElementById("feeToken-button");
const e2 = document.getElementById("feeToken");
if (b2 && e2){
  b2.addEventListener("click", async () => {
    const feeTokenAddress = await feeToken();
    e2.innerHTML = `Fee token address: ${feeTokenAddress}`;
  });
}

