import csvParse from 'csv-parse';
import fs from 'fs';
import { getRepository, In } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const readCSVStream = fs.createReadStream(filePath);
    const parseStream = csvParse({ from_line: 2, ltrim: true, rtrim: true });
    const parseCSV = readCSVStream.pipe(parseStream);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', line => {
      const [title, type, value, category] = line;

      if (!title || !type || !value) {
        return;
      }

      transactions.push({ title, type, value, category });
      categories.push(category);
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const categoriesRepository = getRepository(Category);
    const existentCategories = await categoriesRepository.find({
      where: { title: In(categories) },
    });

    const existentCategoriesTitle = existentCategories.map(
      category => category.title,
    );

    const addCategoryTitles = categories
      .filter(categoryTitle => !existentCategoriesTitle.includes(categoryTitle))
      .filter((value, index, self) => self.indexOf(value) === index);

    const createdCategories = categoriesRepository.create(
      addCategoryTitles.map(category => ({ title: category })),
    );

    await categoriesRepository.save(createdCategories);

    const finalCategories = [...existentCategories, ...createdCategories];

    const transactionsRepository = getRepository(Transaction);
    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(createdTransactions);

    fs.promises.unlink(filePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
