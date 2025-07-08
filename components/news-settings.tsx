"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Settings } from "lucide-react"

interface RSSSource {
  id: string
  name: string
  url: string
  enabled: boolean
  category: string
}

export default function NewsSettings() {
  const [rssSources, setRssSources] = useState<RSSSource[]>([
    {
      id: "1",
      name: "TechCrunch",
      url: "https://techcrunch.com/feed/",
      enabled: true,
      category: "기술",
    },
    {
      id: "2",
      name: "BBC News",
      url: "http://feeds.bbci.co.uk/news/rss.xml",
      enabled: true,
      category: "국제",
    },
  ])

  const [newSource, setNewSource] = useState({
    name: "",
    url: "",
    category: "",
  })

  const addRSSSource = () => {
    if (newSource.name && newSource.url) {
      const source: RSSSource = {
        id: Date.now().toString(),
        name: newSource.name,
        url: newSource.url,
        enabled: true,
        category: newSource.category || "기타",
      }
      setRssSources([...rssSources, source])
      setNewSource({ name: "", url: "", category: "" })
    }
  }

  const removeRSSSource = (id: string) => {
    setRssSources(rssSources.filter((source) => source.id !== id))
  }

  const toggleSource = (id: string) => {
    setRssSources(rssSources.map((source) => (source.id === id ? { ...source, enabled: !source.enabled } : source)))
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">뉴스 스크래핑 설정</h1>
      </div>

      {/* RSS 소스 추가 */}
      <Card>
        <CardHeader>
          <CardTitle>새 RSS 소스 추가</CardTitle>
          <CardDescription>뉴스를 수집할 RSS 피드 URL을 추가하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="source-name">소스 이름</Label>
              <Input
                id="source-name"
                placeholder="예: 조선일보"
                value={newSource.name}
                onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="source-url">RSS URL</Label>
              <Input
                id="source-url"
                placeholder="https://example.com/rss"
                value={newSource.url}
                onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="source-category">카테고리</Label>
              <Input
                id="source-category"
                placeholder="예: 정치, 경제, 기술"
                value={newSource.category}
                onChange={(e) => setNewSource({ ...newSource, category: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={addRSSSource} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            RSS 소스 추가
          </Button>
        </CardContent>
      </Card>

      {/* 기존 RSS 소스 관리 */}
      <Card>
        <CardHeader>
          <CardTitle>RSS 소스 관리</CardTitle>
          <CardDescription>현재 등록된 RSS 소스들을 관리하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rssSources.map((source) => (
              <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Switch checked={source.enabled} onCheckedChange={() => toggleSource(source.id)} />
                    <div>
                      <h3 className="font-medium">{source.name}</h3>
                      <p className="text-sm text-gray-500">{source.url}</p>
                      <span className="inline-block px-2 py-1 text-xs bg-gray-100 rounded mt-1">{source.category}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeRSSSource(source.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 스크래핑 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>스크래핑 설정</CardTitle>
          <CardDescription>뉴스 수집 주기와 필터링 옵션을 설정하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scrape-interval">수집 주기 (분)</Label>
              <Input id="scrape-interval" type="number" placeholder="30" defaultValue="30" />
            </div>
            <div>
              <Label htmlFor="max-articles">최대 기사 수</Label>
              <Input id="max-articles" type="number" placeholder="100" defaultValue="100" />
            </div>
          </div>

          <div>
            <Label htmlFor="keywords">키워드 필터 (쉼표로 구분)</Label>
            <Textarea id="keywords" placeholder="AI, 인공지능, 스타트업, 투자" className="h-20" />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="auto-scrape" />
            <Label htmlFor="auto-scrape">자동 스크래핑 활성화</Label>
          </div>

          <Button className="w-full">설정 저장</Button>
        </CardContent>
      </Card>
    </div>
  )
}
