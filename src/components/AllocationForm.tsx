import { useEffect } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputAdornment,
  InputLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import type { AllocationPayload } from '../hooks/useAllocationEngine';
import type { ProgramInput } from '../types';

const programSchema = z.object({
  id: z.string(),
  label: z.string().min(1, 'Label required'),
  size: z
    .number()
    .int('Whole numbers only')
    .min(1, 'At least 1 student'),
});

const formSchema = z
  .object({
    programCount: z.number().int().min(1).max(12),
    programs: z.array(programSchema).min(1),
    studioCap: z
      .number()
      .int('Whole numbers only')
      .min(2, 'Studios should have at least 2 students'),
    allowMixing: z.boolean(),
    totalStudentsOverride: z
      .number()
      .int()
      .min(0)
      .optional()
      .nullable(),
    semestersPerYear: z.number().int().min(1).max(4),
    taCompensation: z.number().int().min(0),
    staffCounts: z.object({
      faculty: z.number().int().min(0),
      taFa: z.number().int().min(0),
      grader: z.number().int().min(0),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.allowMixing && data.programs.length > 0) {
      const programCount = data.programs.length;
      if (data.studioCap < programCount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['studioCap'],
          message: 'Studio cap must be at least the number of programs to keep mixes even.',
        });
      }
    }
  });

export type AllocationFormValues = z.infer<typeof formSchema>;

const defaultValues: AllocationFormValues = {
  programCount: 2,
  studioCap: 20,
  allowMixing: true,
  totalStudentsOverride: null,
  semestersPerYear: 2,
  taCompensation: 6636,
  staffCounts: {
    faculty: 1,
    taFa: 6,
    grader: 2,
  },
  programs: [
    { id: 'p-1', label: 'Program 1', size: 60 },
    { id: 'p-2', label: 'Program 2', size: 60 },
  ],
};

type Props = {
  loading?: boolean;
  onSubmit: (payload: AllocationPayload) => void;
};

export function AllocationForm({ loading = false, onSubmit }: Props) {
  const {
    control,
    handleSubmit,
    register,
    watch,
    formState: { errors, isSubmitting },
    setValue,
    reset,
  } = useForm<AllocationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'programs',
  });

  const programCount = watch('programCount');

  useEffect(() => {
    if (programCount == null) {
      return;
    }

    if (programCount > fields.length) {
      for (let i = fields.length; i < programCount; i += 1) {
        append({
          id: `p-${i + 1}`,
          label: `Program ${i + 1}`,
          size: 50,
        });
      }
    } else if (programCount < fields.length) {
      for (let i = fields.length; i > programCount; i -= 1) {
        remove(i - 1);
      }
    }
  }, [append, programCount, fields.length, remove]);

  const submitHandler = handleSubmit((values) => {
    const payload: AllocationPayload = {
      programs: values.programs.map((program): ProgramInput => ({
        id: program.id,
        label: program.label,
        size: program.size,
      })),
      studioCap: values.studioCap,
      allowMixing: values.allowMixing,
      totalStudentsOverride: values.totalStudentsOverride,
      semestersPerYear: values.semestersPerYear,
      taCompensation: values.taCompensation,
      staffCounts: values.staffCounts,
    };

    onSubmit(payload);
  });

  return (
    <Paper
      elevation={1}
      sx={{
        p: 3,
        borderRadius: 1,
      }}
    >
      <Stack gap={3} component="form" onSubmit={submitHandler}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Allocation Parameters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Number of Programs"
              type="number"
              fullWidth
              disabled={loading || isSubmitting}
              error={Boolean(errors.programCount)}
              helperText={errors.programCount?.message}
              {...register('programCount', { valueAsNumber: true })}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Studio Cap (Max students per studio)"
              type="number"
              fullWidth
              disabled={loading || isSubmitting}
              error={Boolean(errors.studioCap)}
              helperText={errors.studioCap?.message}
              {...register('studioCap', { valueAsNumber: true })}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox disabled={loading || isSubmitting} {...register('allowMixing')} />}
              label="Allow multi-program mixing"
            />
          </Grid>
        </Grid>

        <Divider textAlign="left">Financial Inputs</Divider>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Controller
              name="totalStudentsOverride"
              control={control}
              render={({ field }) => (
                <TextField
                  label="Total Students (override)"
                  type="number"
                  fullWidth
                  disabled={loading || isSubmitting}
                  value={field.value ?? ''}
                  onChange={(event) => {
                    const nextValue = event.target.value === '' ? null : Number(event.target.value);
                    field.onChange(nextValue);
                  }}
                  error={Boolean(errors.totalStudentsOverride)}
                  helperText={errors.totalStudentsOverride?.message ?? 'Optional - defaults to studio total'}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Semesters per Year"
              type="number"
              fullWidth
              disabled={loading || isSubmitting}
              error={Boolean(errors.semestersPerYear)}
              helperText={errors.semestersPerYear?.message}
              {...register('semestersPerYear', { valueAsNumber: true })}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="TA/FA Compensation (per semester)"
              type="number"
              fullWidth
              disabled={loading || isSubmitting}
              error={Boolean(errors.taCompensation)}
              helperText={errors.taCompensation?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography component="span">$</Typography>
                  </InputAdornment>
                ),
              }}
              {...register('taCompensation', { valueAsNumber: true })}
            />
          </Grid>
        </Grid>

        <Divider textAlign="left">Staff Counts (Scenario Modeling)</Divider>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Faculty"
              type="number"
              fullWidth
              disabled={loading || isSubmitting}
              error={Boolean(errors.staffCounts?.faculty)}
              helperText={errors.staffCounts?.faculty?.message}
              {...register('staffCounts.faculty', { valueAsNumber: true })}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="TAs / FAs"
              type="number"
              fullWidth
              disabled={loading || isSubmitting}
              error={Boolean(errors.staffCounts?.taFa)}
              helperText={errors.staffCounts?.taFa?.message}
              {...register('staffCounts.taFa', { valueAsNumber: true })}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Graders"
              type="number"
              fullWidth
              disabled={loading || isSubmitting}
              error={Boolean(errors.staffCounts?.grader)}
              helperText={errors.staffCounts?.grader?.message}
              {...register('staffCounts.grader', { valueAsNumber: true })}
            />
          </Grid>
        </Grid>

        <Stack gap={2}>
          <InputLabel>Program Sizes</InputLabel>
          {fields.map((field, index) => (
            <Grid container spacing={2} key={field.id} alignItems="center">
              <Grid item xs={12} md={5}>
                <TextField
                  label="Label"
                  fullWidth
                  disabled={loading || isSubmitting}
                  defaultValue={field.label}
                  error={Boolean(errors.programs?.[index]?.label)}
                  helperText={errors.programs?.[index]?.label?.message}
                  {...register(`programs.${index}.label` as const)}
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <Controller
                  name={`programs.${index}.size`}
                  control={control}
                  defaultValue={field.size}
                  render={({ field: controllerField }) => (
                    <TextField
                      label="Students"
                      type="number"
                      fullWidth
                      disabled={loading || isSubmitting}
                      value={controllerField.value}
                      onChange={(event) =>
                        controllerField.onChange(Number(event.target.value ?? controllerField.value))
                      }
                      error={Boolean(errors.programs?.[index]?.size)}
                      helperText={errors.programs?.[index]?.size?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  disabled={fields.length === 1 || loading || isSubmitting}
                  onClick={() => {
                    remove(index);
                    const nextCount = Math.max(fields.length - 1, 1);
                    setValue('programCount', nextCount, { shouldValidate: true });
                  }}
                >
                  Remove
                </Button>
              </Grid>
            </Grid>
          ))}
        </Stack>

        {errors.programs && typeof errors.programs.message === 'string' && (
          <FormControl error>
            <FormHelperText>{errors.programs.message}</FormHelperText>
          </FormControl>
        )}

        <Box display="flex" gap={2} justifyContent="flex-end">
          <Button
            type="button"
            variant="text"
            disabled={loading || isSubmitting}
            onClick={() => reset(defaultValues)}
          >
            Reset defaults
          </Button>
          <Button type="submit" variant="contained" disabled={loading || isSubmitting}>
            Calculate Allocation
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
