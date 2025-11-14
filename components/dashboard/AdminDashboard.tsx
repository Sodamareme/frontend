"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { learnersAPI, referentialsAPI, promotionsAPI, attendanceAPI } from "@/lib/api"
import { Users, Book, GraduationCap, Briefcase, Clock, UserMinus } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const CURRENT_YEAR = new Date().getFullYear()
const CURRENT_MONTH = new Date().getMonth() + 1
const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"]
const WEEKS = Array.from({length: 52}, (_, i) => `Semaine ${i + 1}`); // Add after existing constants

interface DashboardStats {
  totalLearners: number;
  totalReferentials: number;
  waitingListCount: number;
  abandonedCount: number;
  currentPromotion: string;
  currentMonth: string;
  currentDay: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLearners: 0,
    totalReferentials: 0,
    waitingListCount: 0,
    abandonedCount: 0,
    currentPromotion: "",
    currentMonth: MONTHS[new Date().getMonth()],
    currentDay: new Date().getDate(),
  });
  const [selectedMonth, setSelectedMonth] = useState("Par Mois") // Update the selectedMonth state default value
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Gender distribution data
  const [genderData, setGenderData] = useState([
    { name: "Hommes", value: 65, color: "#0E8D7B" },
    { name: "Femmes", value: 35, color: "#F7941D" },
  ])

  // Monthly attendance data
  const [monthlyAttendanceData, setMonthlyAttendanceData] = useState<{ name: string; Présence: number; Retard: number; Absences: number; }[]>([]) // Initialize with explicit type

  const [chartKey, setChartKey] = useState(Date.now())

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Get active promotion first
        const promotions = await promotionsAPI.getAllPromotions();
        const activePromotion = promotions.find(p => p.status === 'ACTIVE');

        if (!activePromotion) {
          throw new Error('No active promotion found');
        }

        // Get learners of active promotion
        const learners = await learnersAPI.getAllLearners();
        const activePromotionLearners = learners.filter(l => l.promotionId === activePromotion.id);
        
        // Calculate different learner counts
        const activeLearners = activePromotionLearners.filter(l => l.status === 'ACTIVE' || l.status === 'REPLACEMENT');
        const waitingLearners = activePromotionLearners.filter(l => l.status === 'WAITING');
        const abandonedLearners = activePromotionLearners.filter(l => l.status === 'ABANDONED');

        // Update stats
        setStats(prev => ({
          ...prev,
          totalLearners: activeLearners.length,
          waitingListCount: waitingLearners.length,
          abandonedCount: abandonedLearners.length,
          currentPromotion: activePromotion.name,
          totalReferentials: activePromotion.referentials?.length || 0
        }));

        // Calculate gender distribution for active learners only
        const maleCount = activeLearners.filter(l => l.gender === 'MALE').length;
        const femaleCount = activeLearners.filter(l => l.gender === 'FEMALE').length;
        const total = activeLearners.length || 1;

        const malePercentage = Math.round((maleCount / total) * 100);
        const femalePercentage = Math.round((femaleCount / total) * 100);

        setGenderData([
          { name: "Hommes", value: malePercentage, color: "#0E8D7B" },
          { name: "Femmes", value: femalePercentage, color: "#F7941D" }
        ]);

        // Update attendance data to show monthly by default
        const yearlyStats = await attendanceAPI.getYearlyStats(CURRENT_YEAR).catch(() => null)

        if (yearlyStats?.months) {
          const chartData = yearlyStats.months.map((monthData, index) => ({
            name: MONTHS[index],
            Présence: monthData.present || 0,
            Retard: monthData.late || 0,
            Absences: monthData.absent || 0,
          }))

          if (chartData.some((data) => data.Présence > 0 || data.Retard > 0 || data.Absences > 0)) {
            setMonthlyAttendanceData(chartData)
          } else {
            setMonthlyAttendanceData([
              { name: "Jan", Présence: 50, Retard: 15, Absences: 0 },
              { name: "Fév", Présence: 60, Retard: 15, Absences: 0 },
              { name: "Mar", Présence: 70, Retard: 15, Absences: 15 },
              { name: "Avr", Présence: 60, Retard: 15, Absences: 0 },
              { name: "Mai", Présence: 45, Retard: 15, Absences: 0 },
              { name: "Jun", Présence: 60, Retard: 15, Absences: 0 },
              { name: "Jul", Présence: 65, Retard: 15, Absences: 0 },
              { name: "Aoû", Présence: 75, Retard: 15, Absences: 0 },
              { name: "Sep", Présence: 65, Retard: 15, Absences: 0 },
              { name: "Oct", Présence: 60, Retard: 20, Absences: 0 },
              { name: "Nov", Présence: 50, Retard: 15, Absences: 0 },
              { name: "Déc", Présence: 70, Retard: 15, Absences: 0 },
            ])
          }
        }

        setLoading(false)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load dashboard data")
        setLoading(false)
        setMonthlyAttendanceData([])
      }
    }

    fetchData()
  }, [])

  // Handle month selection change
  const handleMonthChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedMonth(value);
    setLoading(true);
  
    try {
      let chartData: { name: string; Présence: number; Retard: number; Absences: number; }[] = [];
      const currentMonth = new Date().getMonth() + 1;
  
      switch(value) {
        case "Par Mois":
          // Get current month's weekly stats
          const monthlyStats = await attendanceAPI.getMonthlyStats(CURRENT_YEAR, currentMonth);
          
          if (Array.isArray(monthlyStats?.weeks) && monthlyStats.weeks.length > 0) {
            chartData = Array.isArray(monthlyStats.weeks) ? monthlyStats.weeks.map((week) => ({
              name: `S${week.weekNumber}`,
              Présence: week.present || 0,
              Retard: week.late || 0,
              Absences: week.absent || 0,
            })) : [];
          }
          break;
  
        case "Par Semaine":
          // Get current week's daily stats
          const today = new Date();
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
  
          const weeklyPromises = Array.from({ length: 7 }, (_, index) => {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + index);
            return attendanceAPI.getDailyStats(date.toISOString().split('T')[0]);
          });
  
          const weeklyResults = await Promise.all(weeklyPromises);
          const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  
          chartData = weeklyResults.map((day, index) => ({
            name: daysOfWeek[index],
            Présence: day.present || 0,
            Retard: day.late || 0,
            Absences: day.absent || 0,
          }));
          break;
  
        case "Cette Année":
          const annualStats = await attendanceAPI.getYearlyStats(CURRENT_YEAR).catch(() => null);
  
          if (annualStats?.months && annualStats.months.some(m => m.present || m.late || m.absent)) {
            chartData = annualStats.months.map((month, index) => ({
              name: MONTHS[index],
              Présence: month.present || 0,
              Retard: month.late || 0,
              Absences: month.absent || 0,
            }));
          }
          break;
      }
  
      setMonthlyAttendanceData(chartData);
      setChartKey(Date.now());
    } catch (err) {
      console.error("Error fetching period data:", err);
      setMonthlyAttendanceData([]);
      setChartKey(Date.now());
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="p-6 bg-gray-50">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Active Learners Card */}
        <StatsCard
          title="Apprenants"
          value={stats.totalLearners}
          icon={<Users className="h-8 w-8 text-orange-500" />}
          loading={loading}
        />

        {/* Referentials Card */}
        <StatsCard
          title="Référentiels"
          value={stats.totalReferentials}
          icon={<Book className="h-8 w-8 text-orange-500" />}
          loading={loading}
        />

        {/* Waiting List Card */}
        <StatsCard
          title="Liste d'attente"
          value={stats.waitingListCount}
          icon={<Clock className="h-8 w-8 text-orange-500" />}
          loading={loading}
        />

        {/* Abandoned Card */}
        <StatsCard
          title="Abandons"
          value={stats.abandonedCount}
          icon={<UserMinus className="h-8 w-8 text-orange-500" />}
          loading={loading}
        />
      </div>

      {/* Sonatel Card and Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sonatel Card */}
        <div className="bg-white rounded-lg p-6 shadow-lg relative">
         
          <div className="flex flex-col items-center">
            <div className="mb-6 relative h-16 w-full flex justify-center">
              <img
                src="https://res.cloudinary.com/drxouwbms/image/upload/v1743507686/image_27_qtiin4.png"
                alt="Sonatel Logo"
                className="h-full"
              />
            </div>

            <p className="text-gray-400 text-xs text-center mb-8">
              Transformer la vie des personnes grâce à nos solutions technologiques innovantes et accessibles.
            </p>

            <div className="flex w-full justify-between items-center">
              <div className="flex flex-col items-center flex-1">
                <p className="text-xl font-bold">{loading ? "-" : stats.totalLearners}</p>
                <p className="text-xs text-gray-500 mt-1">Apprenants</p>
              </div>

              <div className="h-12 w-px bg-gray-200"></div>

              <div className="flex flex-col items-center flex-1">
                <p className="text-xl font-bold">{stats.currentPromotion.replace("Promotion ", "")}</p>
                <p className="text-xs text-gray-500 mt-1">Promotion</p>
              </div>

              <div className="h-12 w-px bg-gray-200"></div>

              <div className="flex flex-col items-center flex-1">
                <p className="text-xl font-bold">10</p>
                <p className="text-xs text-gray-500 mt-1">Mois</p>
              </div>
            </div>
          </div>
        </div>

         {/* Attendance Chart */}
         <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Présences statistiques</h2>
            <select
              className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm"
              value={selectedMonth}
              onChange={handleMonthChange}
            >
              <option value="Par Mois">Par Mois</option>
              <option value="Par Semaine">Par Semaine</option>
              <option value="Cette Année">Cette Année</option>
            </select>
          </div>

          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="h-[300px] w-full" key={chartKey}>
              {monthlyAttendanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyAttendanceData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                    barSize={16}
                    barGap={2}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} height={40} />
                    <YAxis tick={{ fontSize: 12 }} width={40} />
                    <Tooltip
                      cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                      contentStyle={{
                        borderRadius: "4px",
                        border: "none",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      wrapperStyle={{ paddingBottom: "10px" }}
                      iconType="circle"
                    />
                    <Bar
                      name="Présence"
                      dataKey="Présence"
                      fill="#0E8D7B"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={1000}
                    />
                    <Bar
                      name="Retard"
                      dataKey="Retard"
                      fill="#B4E1D8"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={1000}
                    />
                    <Bar
                      name="Absences"
                      dataKey="Absences"
                      fill="#F7941D"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={1000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Aucune donnée disponible pour cette période
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Gender Distribution */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center mb-6">
            <div className="bg-orange-100 rounded-full p-2 mr-3">
              <Users className="h-6 w-6 text-orange-500" />
            </div>
            <h2 className="text-lg font-semibold">{loading ? "-" : stats.totalLearners} Apprenants</h2>
          </div>

          {loading ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="ml-8">
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 rounded-full bg-[#0E8D7B] mr-2"></div>
                  <span className="text-sm mr-4">Hommes</span>
                  <span className="font-medium">{genderData[0].value}%</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-[#F7941D] mr-2"></div>
                  <span className="text-sm mr-4">Femmes</span>
                  <span className="font-medium">{genderData[1].value}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Right Card - Static Image */}
        <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-lg border border-teal-500">
          <img
            src="https://res.cloudinary.com/drxouwbms/image/upload/v1743769995/metrics_npr0b8.png"
            alt="Sonatel Statistics"
            className="w-full h-auto"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        © {CURRENT_YEAR} Orange Digital Center. Tous droits réservés.
      </div>
    </div>
  )
}

// Add a StatsCard component for consistency
const StatsCard = ({ title, value, icon, loading }) => (
  <div 
    className="bg-orange-500 rounded-lg shadow-lg overflow-hidden"
    style={{
      backgroundImage: "url('https://res.cloudinary.com/drxouwbms/image/upload/v1743765994/patternCard_no3lhf.png')",
      backgroundSize: "cover",
      backgroundPosition: "center"
    }}
  >
    <div className="p-6 flex items-center justify-between">
      <div className="text-white">
        <div className="text-4xl font-bold">{loading ? "-" : value}</div>
        <div className="text-sm mt-1">{title}</div>
      </div>
      <div className="bg-white rounded-full p-3">
        {icon}
      </div>
    </div>
  </div>
);

