import { describe, it, expect, vi } from "vitest";
import { sendArcGaslessUserOp } from "@/lib/arc/wallet";

describe("sendArcGaslessUserOp", () => {
  it("sends a zero-value self-call userOp with paymaster:true and returns the on-chain tx hash", async () => {
    const sendUserOperation = vi.fn().mockResolvedValue("0xUSEROPHASH");
    const waitForUserOperationReceipt = vi.fn().mockResolvedValue({ receipt: { transactionHash: "0xTXHASH" } });
    const account = { address: "0x00000000000000000000000000000000000000A1" };
    // minimal stub of the Circle/viem bundler-bound wallet
    const wallet = { account, bundlerClient: { sendUserOperation, waitForUserOperationReceipt } } as never;

    const hash = await sendArcGaslessUserOp(wallet);

    expect(hash).toBe("0xTXHASH");
    expect(sendUserOperation).toHaveBeenCalledTimes(1);
    const arg = sendUserOperation.mock.calls[0][0];
    expect(arg.paymaster).toBe(true); // gas paid via Circle paymaster (USDC-gas), not native
    expect(arg.calls).toEqual([{ to: account.address, value: 0n, data: "0x" }]);
    expect(waitForUserOperationReceipt).toHaveBeenCalledWith({ hash: "0xUSEROPHASH" });
  });
});
