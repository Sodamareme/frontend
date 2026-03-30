
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyRequestToken } from '@/lib/auth/jwt';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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

    const { id } = await context.params;

    const grade = await prisma.grade.findUnique({
      where: { id },
      include: {
        module: {
          select: {
            id: true,
            name: true,
          },
        },
        learner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
            photoUrl: true,
          },
        },
      },
    });

    if (!grade) {
      return NextResponse.json(
        { message: 'Note non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(grade);
  } catch (error: any) {
    console.error('Erreur lors de la récupération de la note:', error);
    
    return NextResponse.json(
      { 
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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

    const { id } = await context.params;
    const body = await request.json();
    const { value, comment } = body;
    const numericValue = Number(value);

    console.log('PUT /api/grades/[id] - Données reçues:', { id, value, comment });

    // Validation des données
    if (value === undefined || value === null) {
      return NextResponse.json(
        { message: 'Le champ value est requis' },
        { status: 400 }
      );
    }

    if (Number.isNaN(numericValue) || numericValue < 0 || numericValue > 20) {
      return NextResponse.json(
        { message: 'La note doit être comprise entre 0 et 20' },
        { status: 400 }
      );
    }

    // Vérifier que la note existe
    const existingGrade = await prisma.grade.findUnique({
      where: { id },
    });

    if (!existingGrade) {
      return NextResponse.json(
        { message: 'Note non trouvée' },
        { status: 404 }
      );
    }

    // Mettre à jour la note
    const updatedGrade = await prisma.grade.update({
      where: { id },
      data: {
        value: numericValue,
        comment: typeof comment === 'string' ? comment.trim() : '',
      },
      include: {
        module: {
          select: {
            id: true,
            name: true,
          },
        },
        learner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
            photoUrl: true,
          },
        },
      },
    });

    console.log('Note mise à jour avec succès:', updatedGrade.id);

    return NextResponse.json(updatedGrade);
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la note:', error);
    
    return NextResponse.json(
      { 
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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

    const { id } = await context.params;

    // Vérifier que la note existe
    const existingGrade = await prisma.grade.findUnique({
      where: { id },
    });

    if (!existingGrade) {
      return NextResponse.json(
        { message: 'Note non trouvée' },
        { status: 404 }
      );
    }

    // Supprimer la note
    await prisma.grade.delete({
      where: { id },
    });

    console.log('Note supprimée avec succès:', id);

    return NextResponse.json(
      { message: 'Note supprimée avec succès' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erreur lors de la suppression de la note:', error);
    
    return NextResponse.json(
      { 
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
