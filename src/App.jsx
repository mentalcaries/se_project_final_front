import { HashRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import HomePage from './pages/Home.jsx'
import SavedNewsPage from './pages/SavedNews.jsx'
import { newsApiBaseUrl, NEWS_API_KEY } from './utils/constants.js'

function formatDate(date) {
  return date.toISOString().slice(0, 10)
}

function App() {
  const [articles, setArticles] = useState([])
  const [visibleCount, setVisibleCount] = useState(3)
  const [isLoading, setIsLoading] = useState(false)
  const [searchError, setSearchError] = useState("")
  const [searchExecuted, setSearchExecuted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [savedArticles, setSavedArticles] = useState([])

  useEffect(() => {
    setIsLoggedIn(Boolean(localStorage.getItem('authToken')))
    const saved = window.localStorage.getItem('savedArticles')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setSavedArticles(parsed)
        }
      } catch (error) {
        console.error('Failed to parse saved articles', error)
      }
    }
  }, [])

  const handleAuthChange = (loggedIn) => {
    setIsLoggedIn(loggedIn)
  }

  const handleSearch = async (query) => {
    if (!NEWS_API_KEY) {
      setSearchError(
        "Sorry, something went wrong during the request. Please try again later."
      )
      setArticles([])
      setSearchExecuted(true)
      return
    }

    setSearchError("")
    setSearchExecuted(true)
    setIsLoading(true)
    setSearchTerm(query)
    setVisibleCount(3)
    setArticles([])

    const toDate = new Date()
    const fromDate = new Date(toDate)
    fromDate.setDate(fromDate.getDate() - 7)

    const url = `${newsApiBaseUrl}?q=${encodeURIComponent(
      query
    )}&apiKey=${encodeURIComponent(
      NEWS_API_KEY
    )}&from=${formatDate(fromDate)}&to=${formatDate(toDate)}&pageSize=100`

    try {
      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok || !Array.isArray(data.articles)) {
        throw new Error(data?.message || "Unexpected response from News API")
      }

      setArticles(data.articles)
    } catch (error) {
      console.error(error)
      setSearchError(
        "Sorry, something went wrong during the request. Please try again later."
      )
      setArticles([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleShowMore = () =>
    setVisibleCount((current) => Math.min(current + 3, articles.length))

  const handleToggleSave = (article) => {
    if (!isLoggedIn) return

    setSavedArticles((current) => {
      const isAlreadySaved = current.some((saved) => saved.url === article.url)
      const next = isAlreadySaved
        ? current.filter((saved) => saved.url !== article.url)
        : [...current, article]

      window.localStorage.setItem('savedArticles', JSON.stringify(next))
      return next
    })
  }

  const savedArticleUrls = savedArticles.map((saved) => saved.url)

  return (
    <HashRouter>
      <div className="app-shell">
        <Header onAuthChange={handleAuthChange} isLoggedIn={isLoggedIn} />
        <main className="app-content">
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  onSearch={handleSearch}
                  articles={articles}
                  visibleCount={visibleCount}
                  onShowMore={handleShowMore}
                  isLoading={isLoading}
                  searchExecuted={searchExecuted}
                  searchError={searchError}
                  searchTerm={searchTerm}
                  onToggleSave={handleToggleSave}
                  savedArticleUrls={savedArticleUrls}
                  isLoggedIn={isLoggedIn}
                />
              }
            />
            <Route
              path="/saved-news"
              element={
                <SavedNewsPage
                  savedArticles={savedArticles}
                  isLoggedIn={isLoggedIn}
                  onToggleSave={handleToggleSave}
                />
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </HashRouter>
  )
}

export default App
