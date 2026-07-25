-- Impide stock negativo a nivel de base de datos (complementa validacion en aplicacion).
ALTER TABLE "inventory_items"
ADD CONSTRAINT "inventory_items_quantity_available_non_negative"
CHECK ("quantity_available" >= 0);
