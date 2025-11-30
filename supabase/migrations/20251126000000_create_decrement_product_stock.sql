-- Atomic stock decrement helper for product orders
-- Ensures stock is only reduced when sufficient inventory exists and returns metadata

create or replace function public.decrement_product_stock(
  p_product_id uuid,
  p_quantity integer
)
returns jsonb
language plpgsql
as $$
declare
  v_prev_stock integer;
  v_new_stock integer;
begin
  if p_quantity is null or p_quantity < 1 then
    raise exception 'Quantity must be a positive integer.';
  end if;

  -- Attempt to decrement stock only if enough stock exists
  update public.products
  set stock = stock - p_quantity
  where id = p_product_id
    and stock >= p_quantity
  returning stock + p_quantity, stock
  into v_prev_stock, v_new_stock;

  if not found then
    -- Not enough stock or product not found; return available stock if product exists
    select stock into v_prev_stock from public.products where id = p_product_id;
    return jsonb_build_object(
      'updated', false,
      'available', coalesce(v_prev_stock, 0)
    );
  end if;

  return jsonb_build_object(
    'updated', true,
    'previous_stock', v_prev_stock,
    'new_stock', v_new_stock
  );
end;
$$;

-- Optional: grant execute to authenticated users via edge functions (runs as service role anyway)
-- grant execute on function public.decrement_product_stock(uuid, integer) to authenticated;