import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
})

const countAll = async (table) => {
  const { count, error } = await sb.from(table).select('*', { count: 'exact', head: true })
  return error ? `ERROR: ${error.message}` : count
}

const countWhere = async (table, column, value) => {
  const { count, error } = await sb.from(table).select('*', { count: 'exact', head: true }).eq(column, value)
  return error ? `ERROR: ${error.message}` : count
}

const tasksTodo = await countWhere('tasks', 'status', 'todo')
const tasksDone = await countWhere('tasks', 'status', 'done')

const checks = [
  ['team_members', countAll('team_members')],
  ['tasks', countAll('tasks')],
  ['tasks (todo)', tasksTodo],
  ['tasks (done)', tasksDone],
  ['task_dependencies', countAll('task_dependencies')],
  ['roadmap', countAll('roadmap')],
  ['api_endpoints', countAll('api_endpoints')],
  ['security_tests', countAll('security_tests')],
  ['documents', countAll('documents')],
  ['activity_logs', countAll('activity_logs')],
  ['chat_messages', countAll('chat_messages')],
  ['prompts', countAll('prompts')],
]

const values = await Promise.all(checks.map(([, p]) => p))
for (let i = 0; i < checks.length; i += 1) console.log(checks[i][0].padEnd(22), values[i])