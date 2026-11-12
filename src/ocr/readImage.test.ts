import { beforeEach, describe, expect, it, vi } from 'vitest';

const recognize = vi.fn();
const terminate = vi.fn();
const createWorker = vi.fn();

vi.mock('tesseract.js', () => ({ createWorker: (...args: unknown[]) => createWorker(...args) }));

const downscaleImage = vi.fn();
vi.mock('./downscale', () => ({ downscaleImage: (...args: unknown[]) => downscaleImage(...args) }));

import { readImage } from './readImage';

const original = new Blob(['original']);
const shrunk = new Blob(['shrunk']);

beforeEach(() => {
  vi.clearAllMocks();
  downscaleImage.mockResolvedValue(shrunk);
  recognize.mockResolvedValue({ data: { text: 'Water, Sugar' } });
  terminate.mockResolvedValue(undefined);
  createWorker.mockResolvedValue({ recognize, terminate });
});

describe('readImage', () => {
  it('loads worker, core and language data from same-origin /tesseract/ and returns the text', async () => {
    const text = await readImage(original);

    expect(text).toBe('Water, Sugar');
    expect(createWorker).toHaveBeenCalledTimes(1);
    const [lang, , options] = createWorker.mock.calls[0];
    expect(lang).toBe('eng');
    expect(options.workerPath).toMatch(/^\/tesseract\//);
    expect(options.corePath).toMatch(/^\/tesseract\//);
    expect(options.langPath).toMatch(/^\/tesseract\//);
  });

  it('downscales to 2000 px and recognises the downscaled image', async () => {
    await readImage(original);

    expect(downscaleImage).toHaveBeenCalledWith(original, 2000);
    expect(recognize).toHaveBeenCalledWith(shrunk);
  });

  it('returns an empty string when nothing is recognised', async () => {
    recognize.mockResolvedValue({ data: { text: '' } });
    expect(await readImage(original)).toBe('');
  });

  it('reports recognition progress as a fraction and ignores other statuses', async () => {
    const onProgress = vi.fn();
    await readImage(original, onProgress);

    const { logger } = createWorker.mock.calls[0][2];
    logger({ status: 'loading language traineddata', progress: 1 });
    logger({ status: 'recognizing text', progress: 0.4 });

    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith(0.4);
  });

  it('terminates the worker after success', async () => {
    await readImage(original);
    expect(terminate).toHaveBeenCalledTimes(1);
  });

  it('terminates the worker and rejects with an Error when recognition fails', async () => {
    recognize.mockRejectedValue(new Error('boom'));

    await expect(readImage(original)).rejects.toThrow('boom');
    expect(terminate).toHaveBeenCalledTimes(1);
  });

  it('wraps a non-Error rejection in an Error', async () => {
    recognize.mockRejectedValue('bad');
    await expect(readImage(original)).rejects.toBeInstanceOf(Error);
  });

  it('rejects when the image cannot be decoded, without starting a worker', async () => {
    downscaleImage.mockRejectedValue(new Error('decode failed'));

    await expect(readImage(original)).rejects.toThrow('decode failed');
    expect(createWorker).not.toHaveBeenCalled();
  });
});
