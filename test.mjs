import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3';
env.allowLocalModels = false;

async function test() {
  try {
    const segmenter = await pipeline('background-removal');
    console.log('Success with default background-removal!');
  } catch (err) {
    console.error('Error with default background-removal:', err.message);
  }
}
test();
