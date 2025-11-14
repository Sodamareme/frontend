import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Fonction pour vérifier le token JWT
function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;
    
    console.log('DELETE request reçue pour module ID:', id);
    console.log('Utilisateur authentifié:', user);
    
    if (!id) {
      console.error('ID manquant dans la requête');
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
      console.error('Module non trouvé:', id);
      return NextResponse.json(
        { message: 'Module non trouvé' },
        { status: 404 }
      );
    }

    console.log('Module trouvé:', existingModule.name);
    console.log('Nombre de notes associées:', existingModule._count.grades);

    // Supprimer d'abord toutes les notes associées
    if (existingModule._count.grades > 0) {
      console.log('Suppression des notes associées...');
      await prisma.grade.deleteMany({
        where: { moduleId: id }
      });
      console.log('Notes supprimées avec succès');
    }

    // Supprimer le module
    console.log('Suppression du module...');
    await prisma.module.delete({
      where: { id }
    });

    console.log('Module supprimé avec succès');

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
    console.error('Erreur lors de la suppression du module:', error);
    
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