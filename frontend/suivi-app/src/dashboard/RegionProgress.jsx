import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';

const RegionProgress = ({ regionName, progressValue }) => {
    return (
        <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{regionName}</Typography>
                <Typography variant="body2" color="text.secondary">{`${Math.round(progressValue)}%`}</Typography>
            </Box>
            <LinearProgress
                variant="determinate"
                value={progressValue}
                sx={{ height: 15, borderRadius: 5 }}
            />
        </Box>
    );
};

export default RegionProgress;