import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Fonction pour vérifier le token JWT
function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// GET - Récupérer toutes les notes d'un apprenant
export async function GET(
  request: NextRequest,
  { params }: { params: { learnerId: string } }
) {
  try {
    // Vérifier l'authentification
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { message: 'Token d\'authentification manquant ou invalide' },
        { status: 401 }
      );
    }

    const { learnerId } = params;

    // Vérifier si l'apprenant existe
    const learner = await prisma.learner.findUnique({
      where: { id: learnerId }
    });

    if (!learner) {
      return NextResponse.json(
        { message: 'Apprenant non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer toutes les notes de l'apprenant
    const grades = await prisma.grade.findMany({
      where: { learnerId },
      include: {
        module: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(grades, { status: 200 });

  } catch (error: any) {
    console.error('Erreur lors de la récupération des notes de l\'apprenant:', error);
    
    return NextResponse.json(
      { 
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}