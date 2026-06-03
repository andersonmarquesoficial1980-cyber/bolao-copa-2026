import { Score } from "@/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface RankingTableProps {
  ranking: Score[]
  title?: string
}

function getMedal(position: number) {
  if (position === 1) return "bg-yellow-400 text-yellow-950"
  if (position === 2) return "bg-zinc-300 text-zinc-800"
  if (position === 3) return "bg-amber-700 text-amber-100"
  return "bg-muted"
}

export function RankingTable({ ranking, title = "Ranking Geral" }: RankingTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Posição</TableHead>
              <TableHead>Participante</TableHead>
              <TableHead>Pontos</TableHead>
              <TableHead>Exatos</TableHead>
              <TableHead>Acerto de Resultado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranking.map((item, index) => (
              <TableRow key={item.user_id}>
                <TableCell>
                  <Badge className={getMedal(index + 1)}>{index + 1}º</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src={item.profiles?.avatar_url} alt={item.profiles?.nome} />
                      <AvatarFallback>
                        {(item.profiles?.nome || "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{item.profiles?.nome || "Participante"}</span>
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-primary">{item.total_pontos}</TableCell>
                <TableCell>{item.acertos_exatos}</TableCell>
                <TableCell>{item.acertos_resultado}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
