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

// GET - Récupérer toutes les notes d'un module
export async function GET(
  request: NextRequest,
  { params }: { params: { moduleId: string } }
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

    const { moduleId } = params;

    // Vérifier si le module existe
    const module = await prisma.module.findUnique({
      where: { id: moduleId }
    });

    if (!module) {
      return NextResponse.json(
        { message: 'Module non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer toutes les notes du module
    const grades = await prisma.grade.findMany({
      where: { moduleId },
      include: {
        learner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
            photoUrl: true,
            referential: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { learner: { lastName: 'asc' } },
        { learner: { firstName: 'asc' } }
      ]
    });

    return NextResponse.json(grades, { status: 200 });

  } catch (error: any) {
    console.error('Erreur lors de la récupération des notes du module:', error);
    
    return NextResponse.json(
      { 
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}