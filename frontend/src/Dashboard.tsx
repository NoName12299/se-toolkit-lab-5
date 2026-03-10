import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import './App.css'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
)

// API response interfaces
interface ScoreBucket {
  bucket: string
  count: number
}

interface TimelineEntry {
  date: string
  submissions: number
}

interface TaskStats {
  task: string
  avg_score: number
  attempts: number
}

// Chart data interfaces for react-chartjs-2
interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string
    fill?: boolean
  }[]
}

// Available labs for selection
const AVAILABLE_LABS = ['lab-01', 'lab-02', 'lab-03', 'lab-04', 'lab-05']
const DEFAULT_LAB = 'lab-04'

// Storage key for API token (shared with App.tsx)
const STORAGE_KEY = 'api_key'

/**
 * Dashboard component that displays analytics data from the backend API.
 * Shows score distribution (bar chart), submission timeline (line chart),
 * and per-task pass rates (table).
 */
function Dashboard() {
  // State for lab selection
  const [selectedLab, setSelectedLab] = useState<string>(DEFAULT_LAB)

  // State for API data
  const [scoreData, setScoreData] = useState<ScoreBucket[]>([])
  const [timelineData, setTimelineData] = useState<TimelineEntry[]>([])
  const [taskStats, setTaskStats] = useState<TaskStats[]>([])

  // State for loading and error handling
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch analytics data from the backend API.
   * Uses Bearer token authentication with token from localStorage.
   */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem(STORAGE_KEY)
      if (!token) {
        setError('API token not found. Please connect first.')
        setLoading(false)
        return
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }

      try {
        // Fetch all three endpoints in parallel
        const [scoresRes, timelineRes, passRatesRes] = await Promise.all([
          fetch(`/analytics/scores?lab=${selectedLab}`, { headers }),
          fetch(`/analytics/timeline?lab=${selectedLab}`, { headers }),
          fetch(`/analytics/pass-rates?lab=${selectedLab}`, { headers }),
        ])

        // Check for HTTP errors
        if (!scoresRes.ok) {
          throw new Error(`Scores API: HTTP ${scoresRes.status}`)
        }
        if (!timelineRes.ok) {
          throw new Error(`Timeline API: HTTP ${timelineRes.status}`)
        }
        if (!passRatesRes.ok) {
          throw new Error(`Pass rates API: HTTP ${passRatesRes.status}`)
        }

        // Parse JSON responses
        const scores: ScoreBucket[] = await scoresRes.json()
        const timeline: TimelineEntry[] = await timelineRes.json()
        const stats: TaskStats[] = await passRatesRes.json()

        setScoreData(scores)
        setTimelineData(timeline)
        setTaskStats(stats)
      } catch (err) {
        // Handle fetch or JSON parsing errors
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedLab])

  /**
   * Prepare bar chart data for score distribution.
   * Buckets on x-axis, counts on y-axis.
   */
  const scoreChartData: ChartData = {
    labels: scoreData.map((item) => item.bucket),
    datasets: [
      {
        label: 'Number of Submissions',
        data: scoreData.map((item) => item.count),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
      },
    ],
  }

  /**
   * Prepare line chart data for submission timeline.
   * Dates on x-axis, submissions on y-axis.
   */
  const timelineChartData: ChartData = {
    labels: timelineData.map((item) => item.date),
    datasets: [
      {
        label: 'Submissions per Day',
        data: timelineData.map((item) => item.submissions),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
      },
    ],
  }

  // Chart options for consistent styling
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  // Render loading state
  if (loading) {
    return (
      <div className="dashboard">
        <h1>Dashboard</h1>
        <p>Loading analytics data...</p>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="dashboard">
        <h1>Dashboard</h1>
        <p className="error">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Analytics Dashboard</h1>
        <div className="lab-selector">
          <label htmlFor="lab-select">Select Lab: </label>
          <select
            id="lab-select"
            value={selectedLab}
            onChange={(e) => setSelectedLab(e.target.value)}
          >
            {AVAILABLE_LABS.map((lab) => (
              <option key={lab} value={lab}>
                {lab}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="charts-container">
        {/* Score Distribution Bar Chart */}
        <div className="chart-card">
          <h2>Score Distribution</h2>
          <div className="chart-wrapper">
            <Bar data={scoreChartData} options={chartOptions} />
          </div>
        </div>

        {/* Timeline Line Chart */}
        <div className="chart-card">
          <h2>Submission Timeline</h2>
          <div className="chart-wrapper">
            <Line data={timelineChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Pass Rates Table */}
      <div className="table-card">
        <h2>Per-Task Statistics</h2>
        {taskStats.length > 0 ? (
          <table className="stats-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Average Score</th>
                <th>Attempts</th>
              </tr>
            </thead>
            <tbody>
              {taskStats.map((stat) => (
                <tr key={stat.task}>
                  <td>{stat.task}</td>
                  <td>{stat.avg_score.toFixed(2)}</td>
                  <td>{stat.attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No task statistics available.</p>
        )}
      </div>
    </div>
  )
}

export default Dashboard
