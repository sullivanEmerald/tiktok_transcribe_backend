import * as React from 'react';
import { Html, Text, Container } from '@react-email/components';

interface ResetPasswordOtpProps {
  otp: string;
}

export default function ResetPasswordOtp({ otp }: ResetPasswordOtpProps) {
  return (
    <Html lang="en">
      <Container>
        <Text style={{ fontWeight: 'bold', fontSize: '20px' }}>
          Reset your password
        </Text>
        <Text style={{ fontSize: '14px' }}>
          Use the code below to reset your password. This code expires in 10 minutes.
        </Text>
        <Text
          style={{
            fontWeight: 'bold',
            fontSize: '32px',
            letterSpacing: '8px',
            color: '#0209b2',
            margin: '24px 0',
          }}
        >
          {otp}
        </Text>
        <Text style={{ color: '#000', fontSize: '12px' }}>
          If you didn't request a password reset, you can safely ignore this email — your password will not be changed.
        </Text>
        <Text style={{ color: '#000', fontSize: '12px', marginTop: '20px' }}>
          Thank you for using our service!
        </Text>
      </Container>
    </Html>
  );
}