// app/api/grades/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyRequestToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const user = verifyRequestToken(request);
    if (!user) {
      return NextResponse.json(
        { message: "Token d'authentification manquant ou invalide" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { moduleId, learnerId, value, comment } = body;
    const numericValue = Number(value);

    if (!moduleId || !learnerId || Number.isNaN(numericValue)) {
      return NextResponse.json(
        { message: 'moduleId, learnerId et value sont requis' },
        { status: 400 }
      );
    }

    if (numericValue < 0 || numericValue > 20) {
      return NextResponse.json(
        { message: 'La note doit être comprise entre 0 et 20' },
        { status: 400 }
      );
    }

    const [module, learner, existingGrade] = await Promise.all([
      prisma.module.findUnique({ where: { id: moduleId }, select: { id: true } }),
      prisma.learner.findUnique({ where: { id: learnerId }, select: { id: true } }),
      prisma.grade.findFirst({
        where: { moduleId, learnerId },
        select: { id: true },
      }),
    ]);

    if (!module) {
      return NextResponse.json({ message: 'Module non trouvé' }, { status: 404 });
    }

    if (!learner) {
      return NextResponse.json({ message: 'Apprenant non trouvé' }, { status: 404 });
    }

    if (existingGrade) {
      return NextResponse.json(
        { message: 'Une note existe déjà pour cet apprenant dans ce module' },
        { status: 409 }
      );
    }

    const newGrade = await prisma.grade.create({
      data: {
        moduleId,
        learnerId,
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

    return NextResponse.json(newGrade, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: 'Erreur lors de la création de la note',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = verifyRequestToken(request);
    if (!user) {
      return NextResponse.json(
        { message: "Token d'authentification manquant ou invalide" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');
    const learnerId = searchParams.get('learnerId');

    const where = {
      ...(moduleId ? { moduleId } : {}),
      ...(learnerId ? { learnerId } : {}),
    };

    const grades = await prisma.grade.findMany({
      where,
      include: {
        module: {
          select: {
            id: true,
            name: true,
            description: true,
            startDate: true,
            endDate: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(grades, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: 'Erreur lors de la récupération des notes',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
