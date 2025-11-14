import React from 'react';
import { User, Mail, Calendar, GraduationCap, Hash, CheckCircle } from 'lucide-react';
import type { Student } from '../../types/Student';

interface StudentCardProps {
  student: Student;
  scanTime: Date;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, scanTime }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'graduated':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'inactive':
        return 'Inactif';
      case 'graduated':
        return 'Diplômé';
      default:
        return 'Inconnu';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="relative inline-block">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            {student.photo ? (
              <img 
                src={student.photo} 
                alt={`${student.firstName} ${student.lastName}`}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="h-10 w-10 text-white" />
            )}
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle className="h-4 w-4 text-white" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          {student.firstName} {student.lastName}
        </h2>
        
        <div className="flex items-center justify-center mb-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(student.status)}`}>
            {getStatusText(student.status)}
          </span>
        </div>
        
        <p className="text-sm text-gray-500">
          Scanné le {scanTime.toLocaleDateString('fr-FR')} à {scanTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <Hash className="h-5 w-5 text-gray-400 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Numéro étudiant</p>
            <p className="font-medium text-gray-900">{student.studentNumber}</p>
          </div>
        </div>

        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <Mail className="h-5 w-5 text-gray-400 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium text-gray-900">{student.email}</p>
          </div>
        </div>

        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <GraduationCap className="h-5 w-5 text-gray-400 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Programme</p>
            <p className="font-medium text-gray-900">{student.program}</p>
          </div>
        </div>

        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <Calendar className="h-5 w-5 text-gray-400 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Année & Inscription</p>
            <p className="font-medium text-gray-900">
              {student.year}ème année • {new Date(student.enrollmentDate).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex justify-center space-x-4">
          <button className="flex-1 bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors font-medium">
            Valider présence
          </button>
          <button className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium">
            Voir profil
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentCard;