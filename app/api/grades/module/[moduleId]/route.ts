
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyRequestToken } from '@/lib/auth/jwt';

// GET - Récupérer toutes les notes d'un module
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ moduleId: string }> }
) {
  try {
    // Vérifier l'authentification
    const user = verifyRequestToken(request);
    if (!user) {
      return NextResponse.json(
        { message: 'Token d\'authentification manquant ou invalide' },
        { status: 401 }
      );
    }

    const { moduleId } = await context.params;

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
