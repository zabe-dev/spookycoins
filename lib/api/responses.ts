import { NextResponse } from 'next/server';

type ApiResponse<T> = {
  success: boolean;
  code: string;
  message: string;
  data: T | null;
};

export function apiSuccess<T>(data: T, message = 'Request completed.') {
  return NextResponse.json<ApiResponse<T>>({
    success: true,
    code: 'OK',
    message,
    data,
  });
}

export function apiError(code: string, message: string, status = 400) {
  return NextResponse.json<ApiResponse<never>>(
    {
      success: false,
      code,
      message,
      data: null,
    },
    { status },
  );
}
