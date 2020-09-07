import { getRepository, getCustomRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import AppError from '../errors/AppError';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const { total } = await transactionsRepository.getBalance();
    const isOutcome = type === 'outcome';

    if (isOutcome && value > Number(total)) {
      throw new AppError('You dont have enough balance for this transaction');
    }

    const categoriesRepository = getRepository(Category);

    let categoryFinded = await categoriesRepository.findOne({
      where: {
        title: category,
      },
    });

    if (!categoryFinded) {
      const newCategory = categoriesRepository.create({ title: category });
      categoryFinded = await categoriesRepository.save(newCategory);
    }

    const category_id = categoryFinded.id;
    const transaction = transactionsRepository.create({
      title,
      category_id,
      type,
      value,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
