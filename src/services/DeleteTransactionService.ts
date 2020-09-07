import { getRepository } from 'typeorm';
import { isUuid } from 'uuidv4';

import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    if (!isUuid(id)) {
      throw new AppError('Transaction id is invalid.');
    }

    const transactionsRepository = getRepository(Transaction);

    const transaction = await transactionsRepository.findOne(id);

    if (!transaction) {
      throw new AppError('No transaction was founded with the given id.');
    }

    await transactionsRepository.remove(transaction);
  }
}

export default DeleteTransactionService;
