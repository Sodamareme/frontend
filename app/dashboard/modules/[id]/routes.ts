import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestToken } from '@/lib/auth/jwt';

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

    if (!id) {
      return NextResponse.json(
        { message: 'ID du module requis' },
        { status: 400 }
      );
    }

    // Vérifiez d'abord si le module existe
    const existingModule = await prisma.module.findUnique({
      where: { id },
      include: {
        _count: {
          select: { grades: true }
        }
      }
    });
    
    if (!existingModule) {
      return NextResponse.json(
        { message: 'Module non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer d'abord toutes les notes associées
    if (existingModule._count.grades > 0) {
      await prisma.grade.deleteMany({
        where: { moduleId: id }
      });
    }

    // Supprimer le module
    await prisma.module.delete({
      where: { id }
    });

    return NextResponse.json(
      { 
        message: 'Module supprimé avec succès',
        deletedModule: {
          id: existingModule.id,
          name: existingModule.name
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    // Gestion spécifique des erreurs Prisma
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Module non trouvé' },
        { status: 404 }
      );
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { message: 'Impossible de supprimer le module : des données liées existent encore' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
