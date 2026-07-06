import { Injectable } from '@angular/core';
import { SyncDocument } from '../models/sync.model';
import { base64ToUtf8, utf8ToBase64 } from '../utils/base64.util';
import { emptySyncDocument } from '../utils/sync-merge.util';
import { GithubTokenService } from './github-token.service';

const API_BASE = 'https://api.github.com';
const OWNER = 'mariaIstrate06';
const REPO = 'caltracker';
const BRANCH = 'data';
const FILE_PATH = 'store.json';
const API_VERSION = '2022-11-28';

export class GithubApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'GithubApiError';
  }
}

/** Low-level GitHub REST calls for the dedicated `data` branch. Knows nothing about merging. */
@Injectable({ providedIn: 'root' })
export class GithubApiService {
  constructor(private tokenService: GithubTokenService) {}

  /** Fetches store.json from the data branch. Returns null if the file doesn't exist yet. */
  async getFile(): Promise<{ doc: SyncDocument; sha: string } | null> {
    const response = await this.request(`/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`, {
      method: 'GET',
    });
    if (response.status === 404) {
      return null;
    }
    await this.throwIfError(response);
    const body = await response.json();
    const doc = JSON.parse(base64ToUtf8(body.content)) as SyncDocument;
    return { doc, sha: body.sha };
  }

  /** Writes store.json to the data branch. Pass `sha: null` to create it for the first time. */
  async putFile(doc: SyncDocument, sha: string | null): Promise<{ sha: string }> {
    const response = await this.request(`/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: 'Sync CalTrack data',
        content: utf8ToBase64(JSON.stringify(doc, null, 2)),
        branch: BRANCH,
        ...(sha ? { sha } : {}),
      }),
    });
    await this.throwIfError(response);
    const body = await response.json();
    return { sha: body.content.sha };
  }

  /**
   * Creates the `data` branch as an orphan (empty-history) branch if it doesn't exist yet, seeding
   * its first commit with an empty store.json. GitHub's tree-creation endpoint rejects a truly empty
   * `tree: []`, so the branch and the file are created together in one commit rather than as two steps.
   * Idempotent.
   */
  async ensureDataBranch(): Promise<void> {
    const refResponse = await this.request(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`, { method: 'GET' });
    if (refResponse.status !== 404) {
      await this.throwIfError(refResponse);
      return;
    }

    const blobResponse = await this.request(`/repos/${OWNER}/${REPO}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({ content: JSON.stringify(emptySyncDocument(), null, 2), encoding: 'utf-8' }),
    });
    await this.throwIfError(blobResponse);
    const blob = await blobResponse.json();

    const treeResponse = await this.request(`/repos/${OWNER}/${REPO}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({ tree: [{ path: FILE_PATH, mode: '100644', type: 'blob', sha: blob.sha }] }),
    });
    await this.throwIfError(treeResponse);
    const tree = await treeResponse.json();

    const commitResponse = await this.request(`/repos/${OWNER}/${REPO}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({ message: 'Initialize data branch', tree: tree.sha, parents: [] }),
    });
    await this.throwIfError(commitResponse);
    const commit = await commitResponse.json();

    const createRefResponse = await this.request(`/repos/${OWNER}/${REPO}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/heads/${BRANCH}`, sha: commit.sha }),
    });
    await this.throwIfError(createRefResponse);
  }

  private request(path: string, init: RequestInit): Promise<Response> {
    const token = this.tokenService.getToken();
    return fetch(`${API_BASE}${path}`, {
      ...init,
      keepalive: true,
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': API_VERSION,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
  }

  private async throwIfError(response: Response): Promise<void> {
    if (response.ok) {
      return;
    }
    let message = response.statusText;
    try {
      const body = await response.json();
      message = body.message ?? message;
    } catch {
      // response body wasn't JSON; fall back to statusText
    }
    const path = new URL(response.url).pathname;
    throw new GithubApiError(response.status, `${message} [${path}]`);
  }
}
