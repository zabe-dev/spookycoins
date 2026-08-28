'use client';

import { HandleSSOCallback } from '@clerk/react';
import { useRouter } from 'next/navigation';

export default function SSOCallbackPage() {
  const router = useRouter();

  return (
    <HandleSSOCallback
      navigateToApp={() => {
        router.push('/');
      }}
      navigateToSignIn={() => {
        router.push('/');
      }}
      navigateToSignUp={() => {
        router.push('/');
      }}
    />
  );
}
