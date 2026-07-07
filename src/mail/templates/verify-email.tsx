import * as React from 'react';
import { Html, Button, Text, Container } from '@react-email/components';

interface VerifyEmailProps {
  verifyUrl: string;
}

export default function VerifyEmail({ verifyUrl }: VerifyEmailProps) {
  return (
    <Html lang="en">
      <Container>
        <Text style={{ fontWeight: 'bold', fontSize: '20px' }}>Welcome! Please verify your email address to activate your account.</Text>
        <Button
          href={verifyUrl}
          style={{ background: '#0209b2', color: '#fff', padding: '12px 20px', borderRadius: '6px', cursor: 'pointer', textDecoration: 'none', display: 'inline-block', marginTop: '20px' }}
        >
          Verify Email
        </Button>
        <Text style={{ marginTop: '20px', fontSize: '14px' }}>
          If the button above does not work, copy and paste the following link into your web browser:
        </Text>

        <Text style={{ color: '#0209b2', fontSize: '16px', wordBreak: 'break-all' }}>
        {verifyUrl}
        </Text>
        <Text style={{ color: '#000', fontSize: '12px' }}>
          This link expires in 24 hours. If you didn't request this, ignore this email.
        </Text>
        <Text style={{ color: '#000', fontSize: '12px', marginTop: '20px' }}>
          Thank you for using our service!
        </Text>
      </Container>
    </Html>
  );
}