import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    // Validate request body
    if (!email || !password) {
      return NextResponse.json(
        { error: "L'email et le mot de passe sont requis" },
        { status: 400 }
      );
    }
    
    // Forward the authentication request to the backend API
    const response = await axios.post(
      // `${process.env.NEXT_PUBLIC_API_URL || 'https://odc-inside-back.onrender.com'}/auth/login`,
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/login`,
      { email, password }
    );
    
    // Map backend response to expected frontend format
    // Backend returns access_token but frontend expects accessToken
    const responseData = {
      accessToken: response.data.access_token,
      user: response.data.user
    };
    
    // Return the response from the backend
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Login error:', error);
    
    // Handle specific error status codes
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        return NextResponse.json(
          { error: "Email ou mot de passe incorrect" },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: data.message || "Une erreur s'est produite lors de la connexion" },
        { status: status }
      );
    }
    
    // Handle network errors or other issues
    return NextResponse.json(
      { error: "Impossible de se connecter au serveur" },
      { status: 500 }
    );
  }
} 