import QueryBuilder from '@/database/queryBuilder'
import { WorkflowSession, WorkflowSessionItem, CreateWorkflowSessionInput } from '@entities/Workflow'
import { IWorkflowSessionRepository } from './IWorkflowSessionRepository'

function parseSession(row: Record<string, unknown>): WorkflowSession {
  return {
    id: row.id as string,
    step: row.step as string,
    status: row.status as WorkflowSession['status'],
    total: row.total as number,
    expiresAt: row.expires_at as Date,
    createdAt: row.created_at as Date,
  }
}

function parseItem(row: Record<string, unknown>): WorkflowSessionItem {
  const payload = row.payload
  return {
    id: row.id as number,
    sessionId: row.session_id as string,
    payload: (typeof payload === 'string' ? JSON.parse(payload) : payload) as Record<string, unknown>,
    status: row.status as WorkflowSessionItem['status'],
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  }
}

export class SQLWorkflowSessionRepository implements IWorkflowSessionRepository {
  async create(input: CreateWorkflowSessionInput): Promise<WorkflowSession> {
    const ttlHours = input.ttlHours ?? 168 // 7 days default
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000)

    const [session] = await QueryBuilder('workflow_sessions')
      .insert({ step: input.step, total: input.items.length, expires_at: expiresAt })
      .returning('*')

    if (input.items.length > 0) {
      await QueryBuilder('workflow_session_items').insert(
        input.items.map((payload) => ({
          session_id: session.id,
          payload: JSON.stringify(payload),
        }))
      )
    }

    return parseSession(session)
  }

  async nextItem(sessionId: string): Promise<WorkflowSessionItem | null> {
    const rows = await QueryBuilder.raw(
      `UPDATE workflow_session_items
       SET status = 'processing', updated_at = NOW()
       WHERE id = (
         SELECT id FROM workflow_session_items
         WHERE session_id = ? AND status = 'pending'
         ORDER BY id
         LIMIT 1
         FOR UPDATE SKIP LOCKED
       )
       RETURNING *`,
      [sessionId]
    )
    const row = rows.rows?.[0]
    return row ? parseItem(row) : null
  }

  async markItemDone(itemId: number): Promise<void> {
    await QueryBuilder('workflow_session_items')
      .where('id', itemId)
      .update({ status: 'done', updated_at: QueryBuilder.fn.now() })
  }

  async markItemFailed(itemId: number): Promise<void> {
    await QueryBuilder('workflow_session_items')
      .where('id', itemId)
      .update({ status: 'failed', updated_at: QueryBuilder.fn.now() })
  }

  async listItems(sessionId: string): Promise<WorkflowSessionItem[]> {
    const rows = await QueryBuilder('workflow_session_items')
      .where('session_id', sessionId)
      .orderBy('id', 'asc')
    return rows.map(parseItem)
  }

  async deleteExpired(): Promise<number> {
    const count = await QueryBuilder('workflow_sessions')
      .where('expires_at', '<', QueryBuilder.fn.now())
      .delete()
    return count
  }
}
