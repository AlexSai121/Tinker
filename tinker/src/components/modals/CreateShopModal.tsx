import React, { useEffect } from "react";
import { useUiStore } from "../../stores/uiStore";
import { useCreateShop } from "../../hooks/useShops";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { nanoid } from "nanoid";
import { X } from "lucide-react";
import { SHOP_BACKGROUNDS } from "../../utils/constants";
import { useAppSetting } from "../../hooks/useAppSettings";
import { parsePreferences } from "../../utils/preferences";
import { triggerHapticFeedback } from "../../utils/haptics";
import { AnimatedButton } from "../shared/AnimatedButton";
import { SmartTooltip } from "../shared/SmartTooltip";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  backgroundTexture: z.enum(SHOP_BACKGROUNDS),
});

type FormData = z.infer<typeof schema>;

export function CreateShopModal() {
  const closeModal = useUiStore((s) => s.closeModal);
  const setActiveShop = useUiStore((s) => s.setActiveShop);
  const createShop = useCreateShop();
  const { data: preferencesSetting } = useAppSetting("preferences");
  const preferences = parsePreferences(preferencesSetting?.value);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      backgroundTexture: preferences.appearance.defaultShopTexture,
    },
  });

  useEffect(() => {
    reset({
      name: "",
      backgroundTexture: preferences.appearance.defaultShopTexture,
    });
  }, [preferences.appearance.defaultShopTexture, reset]);

  const onSubmit = async (data: FormData) => {
    const newShop = await createShop.mutateAsync({
      id: nanoid(),
      name: data.name,
      backgroundTexture: data.backgroundTexture,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    setActiveShop(newShop.id);
    triggerHapticFeedback("success");
    closeModal();
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-2xl font-normal text-[var(--ui-text-1)]">Create Workshop</h2>
          <SmartTooltip content="Close workshop modal">
            <AnimatedButton onClick={closeModal} variant="ghost" size="icon" aria-label="Close">
              <X size={20} />
            </AnimatedButton>
          </SmartTooltip>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--ui-text-2)]">Workshop Name</label>
            <input 
              {...register("name")} 
              placeholder="E.g., Woodworking, Programming..." 
              className="input w-full" 
              autoFocus
              data-testid="input-shop-name"
            />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message as string}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--ui-text-2)]">Texture</label>
            <div className="grid grid-cols-2 gap-2">
              {SHOP_BACKGROUNDS.map((texture) => (
                <label key={texture} className="cursor-pointer">
                  <input type="radio" value={texture} {...register("backgroundTexture")} className="sr-only peer" />
                <div className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-3 py-2 text-sm capitalize text-[var(--ui-text-2)] transition-colors peer-checked:border-[var(--ui-accent)] peer-checked:text-[var(--ui-accent)]">
                    {texture.replaceAll("_", " ")}
                  </div>
                </label>
              ))}
            </div>
            {errors.backgroundTexture && <p className="mt-1 text-sm text-red-400">{errors.backgroundTexture.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <AnimatedButton type="button" onClick={closeModal} variant="ghost">Cancel</AnimatedButton>
            <AnimatedButton type="submit" disabled={isSubmitting || createShop.isPending} variant="primary" data-testid="btn-create-shop-submit">
              {createShop.isPending ? "Creating..." : "Create Workshop"}
            </AnimatedButton>
          </div>
        </form>
      </div>
    </div>
  );
}
