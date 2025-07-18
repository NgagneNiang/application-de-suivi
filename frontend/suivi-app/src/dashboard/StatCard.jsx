import React from 'react';
import { Card, CardContent, Typography, Box, Grid } from '@mui/material';

const StatCard = ({ title, totalValue, ruralValue, urbainValue, mainValue, completValue, partielValue, refusValue, isStatusCard }) => {
    return (
        <Card sx={{ height: '100%'}} elevation={2}>
            <CardContent>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{fontWeight: 'medium'}}>
                    {title}
                </Typography>
                {isStatusCard ? (
                    <Grid container spacing={1} alignItems="baseline" justifyContent="space-around">
                         <Grid item textAlign="center">
                            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' , color:'#4caf50' }}>
                                {completValue !== undefined ? completValue : '-'}
                            </Typography>
                            <Typography variant="caption" color="success">Complet</Typography>
                         </Grid>
                         <Grid item textAlign="center">
                            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' , color:'#FFC107' }}>
                                {partielValue !== undefined ? partielValue : '-'}
                            </Typography>
                            <Typography variant="caption" color="#FFC107">Partiel</Typography>
                         </Grid>
                         <Grid item textAlign="center">
                            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' , color:'red'}}>
                                {refusValue !== undefined ? refusValue : '-'}
                            </Typography>
                            <Typography variant="caption" color="secondary">Refus</Typography>
                        </Grid>
                    </Grid>
                ) : mainValue ? (
                    <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mt:1 }}>
                        {mainValue}
                    </Typography>
                ) : (
                    <>
                        <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1, color:'#4caf50' }}>
                            {totalValue !== undefined ? totalValue : '-'}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' , gap: { xs: 1, sm: 2 } }}>
                            <div>
                                <Typography variant="body2" color="text.secondary">Rural</Typography>
                                <Typography variant="h6" component="p" sx={{ fontWeight: 'medium' }}>
                                    {ruralValue !== undefined ? ruralValue : '-'}
                                </Typography>
                            </div>
                            <div>
                                <Typography variant="body2" sx={{ color: '' }}>Urbain</Typography>
                                <Typography variant="h6" component="p" sx={{ fontWeight: 'medium' ,color: 'secondary.main'}}>
                                    {urbainValue !== undefined ? urbainValue : '-'}
                                </Typography>
                            </div>
                            <div>
                                
                                <Typography variant="body2" color="text.secondary">Total</Typography>
                                <Typography variant="h6" component="p" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                                    {totalValue !== undefined ? totalValue : '-'}
                                </Typography>
                            </div>
                        </Box>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default StatCard;