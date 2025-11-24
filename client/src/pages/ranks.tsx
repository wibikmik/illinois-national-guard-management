import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield } from "lucide-react";
import { ENLISTED_RANKS, WARRANT_RANKS, OFFICER_RANKS } from "@/lib/ranks";
import { getAuthUser } from "@/lib/auth";

function RankCard({ code, name, level, isCurrentRank }: { 
  code: string; 
  name: string; 
  level: number;
  isCurrentRank?: boolean;
}) {
  return (
    <div className={`p-4 rounded-md border ${isCurrentRank ? 'border-primary bg-primary/5' : 'border-border'}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-lg">{code}</h3>
          <p className="text-sm text-muted-foreground">{name}</p>
        </div>
        {isCurrentRank && (
          <Badge variant="default">Your Rank</Badge>
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        Level {level}
      </div>
    </div>
  );
}

export default function Ranks() {
  const user = getAuthUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold">Rank Structure</h1>
        <p className="text-muted-foreground mt-1">Military hierarchy and progression paths</p>
      </div>

      <Tabs defaultValue="enlisted" className="space-y-4">
        <TabsList>
          <TabsTrigger value="enlisted" data-testid="tab-enlisted">
            Enlisted Ranks
          </TabsTrigger>
          <TabsTrigger value="warrant" data-testid="tab-warrant">
            Warrant Officers
          </TabsTrigger>
          <TabsTrigger value="officer" data-testid="tab-officer">
            Commissioned Officers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enlisted">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Enlisted Ranks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6">
                Enlisted Soldiers are the backbone of the Army. They have specific specialties within an Army unit, 
                perform specific job functions and have the knowledge that ensures the success of their unit's current mission.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ENLISTED_RANKS.map((rank) => (
                  <RankCard 
                    key={rank.code} 
                    {...rank}
                    isCurrentRank={user?.rank === rank.code}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warrant">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Warrant Officer Ranks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6">
                The adaptive technical expert, combat leader, trainer, and advisor. Through progressive levels of expertise 
                in assignments, training, and education, the warrant officer administers, manages, maintains, operates and 
                integrates systems and equipment across the full spectrum of operations.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {WARRANT_RANKS.map((rank) => (
                  <RankCard 
                    key={rank.code} 
                    {...rank}
                    isCurrentRank={user?.rank === rank.code}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="officer">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Commissioned Officer Ranks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6">
                Commissioned officers are the managers, problem solvers, key influencers and planners who lead enlisted 
                Soldiers in all situations. They plan missions, give orders and assign Soldiers tasks.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {OFFICER_RANKS.map((rank) => (
                  <RankCard 
                    key={rank.code} 
                    {...rank}
                    isCurrentRank={user?.rank === rank.code}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Promotion Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">General Requirements</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Minimum time in current rank</li>
                <li>• Required merit points threshold</li>
                <li>• No active severe disciplinary records</li>
                <li>• Recommendation from commanding officer</li>
                <li>• Demonstrated leadership capabilities</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Approval Process</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Eligibility verification by system</li>
                <li>• Review by General-rank officers</li>
                <li>• Final approval authorization</li>
                <li>• Discord role update</li>
                <li>• Public announcement in promotion channel</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
