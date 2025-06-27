"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DateTime } from "luxon"
import { useLiquidationStore } from "@/lib/stores/liquidation-store"
import { TrendingUp, Award, Target, Calendar } from "lucide-react"

// Helper function to safely format DateTime
const formatDateTime = (timestamp: any): string => {
  if (!timestamp) return "Never"
  if (DateTime.isDateTime(timestamp)) return timestamp.toFormat("ff")
  if (typeof timestamp === "string") return DateTime.fromISO(timestamp).toFormat("ff")
  if (typeof timestamp === "number") return DateTime.fromMillis(timestamp).toFormat("ff")
  return "Never"
}

export function AnalyticsView() {
  const { achievements, stats, totalValue, highScore } = useLiquidationStore()

  const unlockedAchievements = achievements.filter((a) => a.unlocked)
  const lockedAchievements = achievements.filter((a) => !a.unlocked)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Math.round(totalValue).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">High Score: ${highScore.toFixed(2).toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Buy Liquidations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.buyCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Short positions liquidated</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sell Liquidations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sellCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Long positions liquidated</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Daily Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dailyStreak} days</div>
            <p className="text-xs text-muted-foreground mt-1">Consecutive active days</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="achievements" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="achievements" className="gap-2">
            <Award className="h-4 w-4" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="records" className="gap-2">
            <Target className="h-4 w-4" />
            Records
          </TabsTrigger>
        </TabsList>

        <TabsContent value="achievements" className="mt-6">
          <div className="space-y-6">
            {/* Unlocked Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Unlocked Achievements ({unlockedAchievements.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {unlockedAchievements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {unlockedAchievements.map((achievement) => (
                      <Card key={achievement.id} className="border-green-500 bg-green-50 dark:bg-green-950">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg">{achievement.title}</h3>
                            <Badge variant="default">Unlocked</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                          {achievement.timestamp && (
                            <p className="text-xs text-green-600 dark:text-green-400">
                              Unlocked: {formatDateTime(achievement.timestamp)}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No achievements unlocked yet. Keep watching liquidations!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Locked Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  Locked Achievements ({lockedAchievements.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lockedAchievements.map((achievement) => (
                    <Card key={achievement.id} className="border-gray-300 bg-gray-50 dark:bg-gray-900 opacity-60">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg">{achievement.title}</h3>
                          <Badge variant="secondary">Locked</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="records" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Largest Liquidation</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.largestLiquidation ? (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-primary">
                      ${stats.largestLiquidation.value.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stats.largestLiquidation.symbol} on {stats.largestLiquidation.exchange}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(stats.largestLiquidation.timestamp)}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No liquidations recorded yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Liquidations</span>
                    <span className="font-medium">{stats.buyCount + stats.sellCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Buy/Sell Ratio</span>
                    <span className="font-medium">
                      {stats.buyCount + stats.sellCount > 0
                        ? `${((stats.buyCount / (stats.buyCount + stats.sellCount)) * 100).toFixed(1)}% / ${((stats.sellCount / (stats.buyCount + stats.sellCount)) * 100).toFixed(1)}%`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Last Active</span>
                    <span className="font-medium">{formatDateTime(stats.lastActive)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
