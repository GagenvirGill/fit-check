import type { MultipartFile } from '@fastify/multipart';
import type { FastifyRequest } from 'fastify';

export const getRequiredMultipartFile = async (
  request: FastifyRequest,
): Promise<{ file?: MultipartFile; error?: string }> => {
  const file = await request.file();
  if (!file) {
    return { error: 'Image file is required' };
  }

  return { file };
};
