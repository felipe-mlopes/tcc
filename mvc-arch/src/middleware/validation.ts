import { Request, Response, NextFunction } from 'express';

export const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/[^\d]/g, '');
  
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 > 9) digit1 = 0;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  let digit2 = 11 - (sum % 11);
  if (digit2 > 9) digit2 = 0;

  return cleanCPF[9] === digit1.toString() && cleanCPF[10] === digit2.toString();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateInvestorData = (req: Request, res: Response, next: NextFunction) => {
  const { email, name, cpf, dateOfBirth, password } = req.body;

  if (!email || !validateEmail(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Nome deve ter pelo menos 2 caracteres' });
  }

  if (!cpf || !validateCPF(cpf)) {
    return res.status(400).json({ error: 'CPF inválido' });
  }

  if (!dateOfBirth || new Date(dateOfBirth) >= new Date()) {
    return res.status(400).json({ error: 'Data de nascimento inválida' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
  }

  next();
};

export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  if (page < 1) {
    return res.status(400).json({ error: 'Página deve ser maior que 0' });
  }

  if (limit < 1 || limit > 100) {
    return res.status(400).json({ error: 'Limite deve estar entre 1 e 100' });
  }

  req.query.page = page.toString();
  req.query.limit = limit.toString();

  next();
};