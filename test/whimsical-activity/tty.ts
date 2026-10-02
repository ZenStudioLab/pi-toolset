export function tty(input = true, output = true): () => void {
  const previousInput = Object.getOwnPropertyDescriptor(process.stdin, "isTTY");
  const previousOutput = Object.getOwnPropertyDescriptor(
    process.stdout,
    "isTTY",
  );
  Object.defineProperty(process.stdin, "isTTY", {
    value: input,
    configurable: true,
  });
  Object.defineProperty(process.stdout, "isTTY", {
    value: output,
    configurable: true,
  });
  return () => {
    if (previousInput)
      Object.defineProperty(process.stdin, "isTTY", previousInput);
    else Reflect.deleteProperty(process.stdin, "isTTY");
    if (previousOutput)
      Object.defineProperty(process.stdout, "isTTY", previousOutput);
    else Reflect.deleteProperty(process.stdout, "isTTY");
  };
}
