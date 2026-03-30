
import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestToken } from '@/lib/auth/jwt';

// GET - Récupérer tous les modules
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const user = verifyRequestToken(request);
    if (!user) {
      return NextResponse.json(
        { message: 'Token d\'authentification manquant ou invalide' },
        { status: 401 }
      );
    }

    const modules = await prisma.module.findMany({
      include: {
        coach: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
          }
        },
        referential: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            grades: true
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    return NextResponse.json(modules, { status: 200 });

  } catch (error: any) {
    console.error('Erreur lors de la récupération des modules:', error);
    
    return NextResponse.json(
      { 
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau module
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const user = verifyRequestToken(request);
    if (!user) {
      return NextResponse.json(
        { message: 'Token d\'authentification manquant ou invalide' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const refId = formData.get('refId') as string;
    const coachId = formData.get('coachId') as string;

    // Validation des données
    if (!name || !startDate || !endDate || !refId || !coachId) {
      return NextResponse.json(
        { message: 'Tous les champs requis doivent être remplis' },
        { status: 400 }
      );
    }

    // Vérifier que les dates sont valides
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return NextResponse.json(
        { message: 'La date de début doit être antérieure à la date de fin' },
        { status: 400 }
      );
    }

    // Créer le module
    const module = await prisma.module.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        startDate: start,
        endDate: end,
        refId,
        coachId,
        photoUrl: null // Gérer l'upload d'image si nécessaire
      },
      include: {
        coach: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
          }
        },
        referential: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return NextResponse.json(module, { status: 201 });

  } catch (error: any) {
    console.error('Erreur lors de la création du module:', error);
    
    return NextResponse.json(
      { 
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
