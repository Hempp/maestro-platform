/**
 * AKU (Atomic Knowledge Unit) API
 * Serves granular learning content from curriculum files
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export interface AKU {
  id: string;
  category: string;
  title: string;
  duration: number;
  prerequisiteAKUs: string[];
  businessKPI: string;
  concept: string;
  visualAid?: string;
  sandboxChallenge: {
    prompt: string;
    expectedOutputSchema: Record<string, unknown>;
    hints: string[];
    maxHints: number;
  };
  alternativeFormats?: {
    visual?: string;
    textual?: string;
    handsOn?: string;
  };
  verificationCriteria: {
    outputValidation: Array<{
      field: string;
      type: string;
      expected: unknown;
    }>;
    executionRequirements: Array<unknown>;
    kpiThreshold?: number;
  };
}

export interface ModuleAKUs {
  moduleId: string;
  moduleTitle: string;
  tier: string;
  akus: AKU[];
}

// Cache for loaded AKUs
let akuCache: Map<string, ModuleAKUs[]> | null = null;

async function loadAllAKUs(): Promise<Map<string, ModuleAKUs[]>> {
  if (akuCache) return akuCache;

  const cache = new Map<string, ModuleAKUs[]>();
  const tiers = ['student', 'employee', 'owner'];
  const basePath = path.join(process.cwd(), 'curriculum', 'aku');

  for (const tier of tiers) {
    const tierPath = path.join(basePath, tier);

    try {
      const files = await fs.readdir(tierPath);
      const modules: ModuleAKUs[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(tierPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const moduleData = JSON.parse(content) as ModuleAKUs;
          modules.push(moduleData);
        }
      }

      // Sort modules by moduleId (they contain order info like module-1, module-2)
      modules.sort((a, b) => a.moduleId.localeCompare(b.moduleId));
      cache.set(tier, modules);
    } catch (error) {
      console.error(`Error loading AKUs for tier ${tier}:`, error);
      cache.set(tier, []);
    }
  }

  akuCache = cache;
  return cache;
}

// GET: Fetch AKUs
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tier = searchParams.get('tier') as 'student' | 'employee' | 'owner' | null;
  const moduleId = searchParams.get('moduleId');
  const akuId = searchParams.get('akuId');

  try {
    const allAKUs = await loadAllAKUs();

    // If specific AKU requested
    if (akuId) {
      for (const [tierKey, modules] of allAKUs) {
        for (const module of modules) {
          const aku = module.akus.find(a => a.id === akuId);
          if (aku) {
            return NextResponse.json({
              aku,
              module: {
                id: module.moduleId,
                title: module.moduleTitle,
                tier: module.tier,
              },
            });
          }
        }
      }
      return NextResponse.json({ error: 'AKU not found' }, { status: 404 });
    }

    // If no tier specified, return summary
    if (!tier) {
      const summary = {
        student: {
          modules: allAKUs.get('student')?.length || 0,
          akus: allAKUs.get('student')?.reduce((sum, m) => sum + m.akus.length, 0) || 0,
        },
        employee: {
          modules: allAKUs.get('employee')?.length || 0,
          akus: allAKUs.get('employee')?.reduce((sum, m) => sum + m.akus.length, 0) || 0,
        },
        owner: {
          modules: allAKUs.get('owner')?.length || 0,
          akus: allAKUs.get('owner')?.reduce((sum, m) => sum + m.akus.length, 0) || 0,
        },
      };
      return NextResponse.json({ summary });
    }

    // Validate tier
    if (!['student', 'employee', 'owner'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be: student, employee, or owner' },
        { status: 400 }
      );
    }

    const tierModules = allAKUs.get(tier) || [];

    // If specific module requested
    if (moduleId) {
      const module = tierModules.find(m => m.moduleId === moduleId);
      if (!module) {
        return NextResponse.json({ error: 'Module not found' }, { status: 404 });
      }
      return NextResponse.json({
        module: {
          id: module.moduleId,
          title: module.moduleTitle,
          tier: module.tier,
          akuCount: module.akus.length,
          totalDuration: module.akus.reduce((sum, a) => sum + a.duration, 0),
        },
        akus: module.akus,
      });
    }

    // Return all modules for tier with simplified AKU list
    const modules = tierModules.map(m => ({
      id: m.moduleId,
      title: m.moduleTitle,
      akuCount: m.akus.length,
      totalDuration: m.akus.reduce((sum, a) => sum + a.duration, 0),
      akus: m.akus.map(a => ({
        id: a.id,
        title: a.title,
        duration: a.duration,
        category: a.category,
        prerequisiteAKUs: a.prerequisiteAKUs,
      })),
    }));

    return NextResponse.json({
      tier,
      moduleCount: modules.length,
      totalAKUs: modules.reduce((sum, m) => sum + m.akuCount, 0),
      totalDuration: modules.reduce((sum, m) => sum + m.totalDuration, 0),
      modules,
    });
  } catch (error) {
    console.error('Error fetching AKUs:', error);
    return NextResponse.json(
      { error: 'Failed to load curriculum content' },
      { status: 500 }
    );
  }
}

// POST: Clear cache (for development)
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'clear-cache') {
    akuCache = null;
    return NextResponse.json({ message: 'Cache cleared' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
