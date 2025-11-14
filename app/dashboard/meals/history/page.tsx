"use client";

import React, { useEffect, useState } from "react";
import {
  Clock,
  User,
  Calendar,
  RefreshCw,
  Coffee,
  Filter,
  ChevronDown,
  BookOpen,
} from "lucide-react";

interface ApiScanResponse {
  id: string;
  date: string;
  type: string;
  learnerId: string;
  createdAt: string;
  updatedAt: string;
  learner: {
    id: string;
    matricule: string;
    firstName: string;
    lastName: string;
    address: string;
    gender: string;
    birthDate: string;
    birthPlace: string;
    phone: string;
    photoUrl: string;
    status: string;
    qrCode: string;
    userId: string;
    refId: string;
    promotionId: string;
    createdAt: string;
    updatedAt: string;
    sessionId: string | null;
    referential?: {
      id: string;
      name: string;
      description: string;
    };
    promotion?: {
      id: string;
      name: string;
    };
  };
}

interface ScanResult {
  id: string;
  student: {
    studentNumber: string;
    firstName: string;
    lastName: string;
    program: string;
    qrCode: string;
    photoUrl: string;
    promotion?: string;
  };
  scanTime: Date;
  mealType: "BREAKFAST" | "LUNCH";
}

const ScanHistory: React.FC = () => {
  const [apiHistory, setApiHistory] = useState<ScanResult[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<ScanResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const [selectedMealType, setSelectedMealType] = useState<
    "ALL" | "BREAKFAST" | "LUNCH"
  >("ALL");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProgram, setSelectedProgram] = useState<string>("ALL");
  const [availablePrograms, setAvailablePrograms] = useState<string[]>([]);

  useEffect(() => setIsClient(true), []);

  const getAuthToken = () =>
    typeof window !== "undefined"
      ? localStorage.getItem("auth_token") || ""
      : "";

  const convertApiToScanResult = (apiData: ApiScanResponse[]): ScanResult[] => {
    return apiData.map((item) => ({
      id: item.id,
      student: {
        studentNumber: item.learner.matricule,
        firstName: item.learner.firstName,
        lastName: item.learner.lastName,
        program: item.learner.referential?.name || "N/A",
        qrCode: item.learner.qrCode,
        photoUrl: item.learner.photoUrl,
        promotion: item.learner.promotion?.name,
      },
      scanTime: new Date(item.createdAt),
      mealType: item.type === "petit-dejeuner" ? "BREAKFAST" : "LUNCH",
    }));
  };

  const fetchAllReferentials = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch("http://localhost:3000/referentials", {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
      const data = await response.json();
      
      console.log("Référentiels reçus:", data); // Pour debug
      
      // Vérifier si data est un tableau
      if (Array.isArray(data)) {
        const programNames = data
          .map((ref: any) => ref.name)
          .filter((name: string) => name && name !== "N/A")
          .sort();
        
        console.log("Programmes extraits:", programNames); // Pour debug
        setAvailablePrograms(programNames);
      } else {
        console.error("Format de données inattendu:", data);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des référentiels:", err);
    }
  };

  const fetchScanHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const response = await fetch("http://localhost:3000/meals/scans/latest", {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
      const data: ApiScanResponse[] = await response.json();
      const convertedData = convertApiToScanResult(data);
      setApiHistory(convertedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isClient) {
      fetchAllReferentials();
      fetchScanHistory();
    }
  }, [isClient]);

  useEffect(() => {
    let filtered = [...apiHistory];

    if (selectedMealType !== "ALL") {
      filtered = filtered.filter((s) => s.mealType === selectedMealType);
    }

    filtered = filtered.filter((s) => {
      const scanDate = new Date(s.scanTime).toISOString().split("T")[0];
      return scanDate === selectedDate;
    });

    if (selectedProgram !== "ALL") {
      filtered = filtered.filter((s) => s.student.program === selectedProgram);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.student.firstName.toLowerCase().includes(q) ||
          s.student.lastName.toLowerCase().includes(q) ||
          s.student.studentNumber.toLowerCase().includes(q)
      );
    }

    filtered.sort(
      (a, b) => new Date(b.scanTime).getTime() - new Date(a.scanTime).getTime()
    );

    setFilteredHistory(filtered);
  }, [apiHistory, selectedMealType, selectedDate, searchQuery, selectedProgram]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-teal-50 p-8 transition-all duration-500">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              🕓 Historique des Scans
            </h1>
            <p className="text-gray-600 mt-2">
              Consultez les repas enregistrés 
            </p>
          </div>

          <button
            onClick={() => {
              fetchAllReferentials();
              fetchScanHistory();
            }}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Chargement..." : "Actualiser"}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-10 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Filter className="h-5 w-5 text-teal-600" /> Filtres
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1 text-gray-500" />
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>

            {/* Type de repas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Coffee className="inline h-4 w-4 mr-1 text-gray-500" />
                Type de repas
              </label>
              <div className="relative">
                <select
                  value={selectedMealType}
                  onChange={(e) =>
                    setSelectedMealType(
                      e.target.value as "ALL" | "BREAKFAST" | "LUNCH"
                    )
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none appearance-none"
                >
                  <option value="ALL">Tous les repas</option>
                  <option value="BREAKFAST">Petit déjeuner</option>
                  <option value="LUNCH">Déjeuner</option>
                </select>
                <ChevronDown className="absolute right-3 top-3 text-gray-500 h-5 w-5 pointer-events-none" />
              </div>
            </div>

            {/* Programme/Référentiel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BookOpen className="inline h-4 w-4 mr-1 text-gray-500" />
                Programme
              </label>
              <div className="relative">
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none appearance-none"
                >
                  <option value="ALL">Tous les programmes</option>
                  {availablePrograms.map((program) => (
                    <option key={program} value={program}>
                      {program}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 text-gray-500 h-5 w-5 pointer-events-none" />
              </div>
            </div>

            {/* Recherche */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-1 text-gray-500" />
                Rechercher
              </label>
              <input
                type="text"
                placeholder="Nom ou matricule..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            {
              title: "Total scans",
              value: filteredHistory.length,
              color: "text-gray-900",
              accent: "bg-gradient-to-r from-gray-100 to-gray-50",
            },
            {
              title: "Petit déjeuner",
              value: filteredHistory.filter((s) => s.mealType === "BREAKFAST").length,
              color: "text-orange-600",
              accent: "bg-gradient-to-r from-orange-100 to-orange-50",
            },
            {
              title: "Déjeuner",
              value: filteredHistory.filter((s) => s.mealType === "LUNCH").length,
              color: "text-green-600",
              accent: "bg-gradient-to-r from-green-100 to-green-50",
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 ${stat.accent}`}
            >
              <p className="text-sm text-gray-600">{stat.title}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Liste */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-16">
              <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-700 text-lg font-medium">
                Aucun scan trouvé
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Essayez d'ajuster les filtres
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {filteredHistory.map((scan) => {
                const date = new Date(scan.scanTime);
                return (
                  <div
                    key={scan.id}
                    className="flex items-center p-4 rounded-xl bg-gradient-to-r from-white to-gray-50 hover:shadow-md hover:scale-[1.01] transition-all duration-200 border border-gray-100"
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden mr-4 border border-gray-200 shadow-sm flex-shrink-0">
                      {scan.student.photoUrl ? (
                        <img
                          src={scan.student.photoUrl}
                          alt={`${scan.student.firstName} ${scan.student.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="bg-gradient-to-br from-teal-400 to-teal-600 w-full h-full flex items-center justify-center">
                          <User className="h-7 w-7 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {scan.student.firstName} {scan.student.lastName}
                      </h4>
                      <p className="text-sm text-gray-600 truncate">
                        {scan.student.program}
                      </p>
                      <p className="text-xs text-gray-500">
                        Promotion {scan.student.promotion ?? "-"} • #
                        {scan.student.studentNumber}
                      </p>
                    </div>

                    <div className="text-right ml-4">
                      <p className="text-sm text-gray-600 flex items-center justify-end">
                        <Clock className="h-4 w-4 mr-1" />
                        {date.toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center justify-end">
                        <Calendar className="h-3 w-3 mr-1" />
                        {date.toLocaleDateString("fr-FR")}
                      </p>
                      <span
                        className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                          scan.mealType === "BREAKFAST"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {scan.mealType === "BREAKFAST"
                          ? "Petit déjeuner"
                          : "Déjeuner"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanHistory;