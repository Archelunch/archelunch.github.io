// White noise processor worklet
class NoiseProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const output = outputs[0];
    
    for (let channel = 0; channel < output.length; channel++) {
      const outputChannel = output[channel];
      for (let i = 0; i < outputChannel.length; i++) {
        // Generate white noise (random values between -1 and 1)
        outputChannel[i] = Math.random() * 2 - 1;
      }
    }
    
    // Return true to keep the processor alive
    return true;
  }
}

// Register the processor
registerProcessor('noise-processor', NoiseProcessor); 