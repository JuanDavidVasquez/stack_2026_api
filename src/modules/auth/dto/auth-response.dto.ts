export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    status: string;
  };
}

export interface RefreshResponseDto {
  accessToken: string;
  refreshToken: string;
}

export interface LogoutResponseDto {
  message: string;
}