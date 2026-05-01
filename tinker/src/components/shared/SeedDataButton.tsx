import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { nanoid } from 'nanoid';
import { Database } from 'lucide-react';
import { AnimatedButton } from '../shared/AnimatedButton';
import { useCreateShop } from '../../hooks/useShops';
import { useCreateWorkbench } from '../../hooks/useWorkbenches';
import { useCreateItem } from '../../hooks/useItems';

export function SeedDataButton() {
  const [isSeeding, setIsSeeding] = useState(false);
  const queryClient = useQueryClient();
  const createShop = useCreateShop();
  const createWorkbench = useCreateWorkbench();
  const createItem = useCreateItem();

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const now = new Date();

      // Create Workshop 1
      const shopId1 = nanoid();
      await createShop.mutateAsync({
        id: shopId1,
        name: "Personal Workspace",
        backgroundTexture: "pegboard",
        createdAt: now,
        updatedAt: now,
      });

      // Create Workshop 2
      const shopId2 = nanoid();
      await createShop.mutateAsync({
        id: shopId2,
        name: "Work Projects",
        backgroundTexture: "concrete",
        createdAt: now,
        updatedAt: now,
      });

      // Create Projects
      const projectsData = [
        { shopId: shopId1, name: "Home Renovation Ideas" },
        { shopId: shopId1, name: "Recipes to Try" },
        { shopId: shopId2, name: "Q3 Marketing Plan" },
        { shopId: shopId2, name: "App Redesign" },
      ];

      for (const p of projectsData) {
        const wbId = nanoid();
        await createWorkbench.mutateAsync({
          id: wbId,
          shopId: p.shopId,
          name: p.name,
          createdAt: now,
          updatedAt: now,
        });

        // Add dummy items
        await createItem.mutateAsync({
          id: nanoid(),
          workbenchId: wbId,
          type: "sticky",
          content: JSON.stringify({ title: "First Note", content: "This is a dummy note inside " + p.name, type: "text" }),
          posX: Math.random() * 400 + 100,
          posY: Math.random() * 300 + 100,
          createdAt: now,
          updatedAt: now,
        });

        await createItem.mutateAsync({
          id: nanoid(),
          workbenchId: wbId,
          type: "sticky",
          content: JSON.stringify({ title: "Second Note", content: "Another idea for " + p.name, type: "text" }),
          posX: Math.random() * 400 + 100,
          posY: Math.random() * 300 + 100,
          createdAt: now,
          updatedAt: now,
        });
      }

      await queryClient.invalidateQueries();
      alert("Successfully seeded test data!");
    } catch (e) {
      console.error(e);
      alert("Failed to seed data");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <AnimatedButton
      type="button"
      onClick={handleSeedData}
      disabled={isSeeding}
      variant="surface"
      className="inline-flex items-center gap-2"
      data-testid="btn-seed-data"
    >
      <Database className="h-4 w-4" />
      {isSeeding ? "Seeding..." : "Inject Test Data"}
    </AnimatedButton>
  );
}
