"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Key, Trash2, Plus } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
}

export function ApiKeysCard() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("Chrome Extension");
  const [justCreated, setJustCreated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/keys");
    const data = await res.json();
    setKeys(data.keys ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.key) {
        setJustCreated(data.key);
        setCopied(false);
        await load();
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Revoke this key? The extension using it will stop working."))
      return;
    await fetch(`/api/keys/${id}`, { method: "DELETE" });
    await load();
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Extension API Keys</CardTitle>
        <CardDescription>
          Generate a key and paste it into the Described Chrome extension to
          upload recordings to this account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {justCreated && (
          <div className="p-4 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 space-y-2">
            <p className="text-xs font-medium">
              Copy this key now. It will not be shown again.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-background rounded px-2 py-1.5 break-all font-mono">
                {justCreated}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copy(justCreated)}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setJustCreated(null)}
            >
              I saved it
            </Button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Key name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Chrome Extension"
            />
          </div>
          <Button onClick={handleCreate} disabled={creating}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {creating ? "Creating..." : "Generate key"}
          </Button>
        </div>

        <div className="space-y-2">
          {loading ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : keys.length === 0 ? (
            <p className="text-xs text-muted-foreground">No keys yet.</p>
          ) : (
            keys.map((k) => (
              <div
                key={k.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                    <Key className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{k.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {k.prefix}...{" "}
                      <span className="font-sans">
                        · created {new Date(k.created_at).toLocaleDateString()}
                        {k.last_used_at &&
                          ` · last used ${new Date(
                            k.last_used_at,
                          ).toLocaleDateString()}`}
                      </span>
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(k.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
