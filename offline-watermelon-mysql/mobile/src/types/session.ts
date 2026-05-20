export type AuthUser = {
  id: string;
  nome: string;
  login: string;
  empresa_id: string;
  empresa: {
    id: string;
    nome: string;
  };
};

export type Session = {
  token: string;
  user: AuthUser;
};
