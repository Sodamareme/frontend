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

export async function GET(
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

    const module = await prisma.module.findUnique({
      where: { id },
      include: {
        referential: {
          select: {
            id: true,
            name: true,
          },
        },
        coach: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        grades: {
          include: {
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
        },
      },
    });

    if (!module) {
      return NextResponse.json(
        { message: 'Module non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(module);
  } catch (error: any) {
    console.error('Erreur lors de la récupération du module:', error);
    
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
    const body = await request.json();
    const { name, description, startDate, endDate, refId, coachId, photoUrl } = body;

    console.log('PUT /api/modules/[id] - Données reçues:', { id, name, description, startDate, endDate, refId, coachId, photoUrl });

    // Vérifier que le module existe
    const existingModule = await prisma.module.findUnique({
      where: { id },
    });

    if (!existingModule) {
      return NextResponse.json(
        { message: 'Module non trouvé' },
        { status: 404 }
      );
    }

    // Validation des données
    if (name && !name.trim()) {
      return NextResponse.json(
        { message: 'Le nom du module ne peut pas être vide' },
        { status: 400 }
      );
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start >= end) {
        return NextResponse.json(
          { message: 'La date de début doit être antérieure à la date de fin' },
          { status: 400 }
        );
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || '';
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (refId !== undefined) updateData.refId = refId;
    if (coachId !== undefined) updateData.coachId = coachId;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;

    // Mettre à jour le module
    const updatedModule = await prisma.module.update({
      where: { id },
      data: updateData,
      include: {
        referential: {
          select: {
            id: true,
            name: true,
          },
        },
        coach: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        grades: {
          include: {
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
        },
      },
    });

    console.log('Module mis à jour avec succès:', updatedModule.id);

    return NextResponse.json(updatedModule);
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du module:', error);
    
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